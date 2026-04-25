import { useState, useEffect, useRef, useCallback } from 'react';
import { REDIRECT_URI } from '../config.js';

// --- PKCE helpers ---

function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function extractPlaylistId(input) {
  const match = input.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : input.trim();
}

// --- Spotify API helpers ---

async function apiGet(url, accessToken) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Spotify API error ${res.status}: ${url}`);
  return res.json();
}

async function fetchAllTracks(playlistId, accessToken) {
  const tracks = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(name,artists,uri,duration_ms,id)),next`;
  while (url) {
    const data = await apiGet(url, accessToken);
    tracks.push(
      ...data.items
        .filter(item => item.track && !item.track.is_local && item.track.uri)
        .map(item => ({
          name: item.track.name,
          artist: item.track.artists[0]?.name ?? '',
          uri: item.track.uri,
          id: item.track.id,
          durationMs: item.track.duration_ms,
        }))
    );
    url = data.next;
  }
  return tracks;
}

// Detect hook start using Audio Analysis API.
// Falls back to 40% of duration if the API is unavailable (deprecated for new apps).
async function detectHookStart(trackId, durationMs, accessToken) {
  try {
    const analysis = await apiGet(
      `https://api.spotify.com/v1/audio-analysis/${trackId}`,
      accessToken
    );
    const sections = analysis.sections ?? [];
    const middleStart = durationMs * 0.2;
    const middleEnd = durationMs * 0.8;
    const middle = sections.filter(s => s.start * 1000 >= middleStart && s.start * 1000 <= middleEnd);
    if (middle.length === 0) return Math.floor(durationMs * 0.4);
    // Loudness is negative dB — least negative = loudest
    const best = middle.reduce((a, b) => b.loudness > a.loudness ? b : a);
    return Math.round(best.start * 1000);
  } catch {
    return Math.floor(durationMs * 0.4);
  }
}

// Load the Spotify Web Playback SDK script once
function loadSDK() {
  return new Promise(resolve => {
    if (window.Spotify) { resolve(); return; }
    window.onSpotifyWebPlaybackSDKReady = resolve;
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    document.head.appendChild(script);
  });
}

// --- Hook ---

export function useSpotify(clientId) {
  const [accessToken, setAccessToken] = useState(() =>
    sessionStorage.getItem('spotify_access_token')
  );
  const [refreshTokenValue, setRefreshToken] = useState(() =>
    sessionStorage.getItem('spotify_refresh_token')
  );
  const [isPremium, setIsPremium] = useState(null);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [sdkError, setSdkError] = useState(null);
  const playerRef = useRef(null);
  const refreshTimerRef = useRef(null);

  // Handle OAuth callback: exchange code for tokens
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code || !clientId) return;

    const verifier = sessionStorage.getItem('spotify_code_verifier');
    if (!verifier) return;

    (async () => {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: clientId,
        code_verifier: verifier,
      });
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await res.json();
      if (data.access_token) {
        sessionStorage.setItem('spotify_access_token', data.access_token);
        sessionStorage.setItem('spotify_refresh_token', data.refresh_token);
        sessionStorage.setItem('spotify_expires_at', String(Date.now() + data.expires_in * 1000));
        sessionStorage.removeItem('spotify_code_verifier');
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        scheduleRefresh(data.expires_in);
        window.history.replaceState({}, '', window.location.pathname);
      }
    })();
  }, [clientId]);

  // On mount, restart the refresh timer if we restored a token from sessionStorage
  useEffect(() => {
    if (!accessToken) return;
    const expiresAt = parseInt(sessionStorage.getItem('spotify_expires_at') ?? '0', 10);
    const remainingSec = Math.floor((expiresAt - Date.now()) / 1000);
    if (remainingSec > 60) scheduleRefresh(remainingSec);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user profile to check Premium
  useEffect(() => {
    if (!accessToken) return;
    apiGet('https://api.spotify.com/v1/me', accessToken)
      .then(data => setIsPremium(data.product === 'premium'))
      .catch(() => {});
  }, [accessToken]);

  // Initialize Web Playback SDK once we have a token
  useEffect(() => {
    if (!accessToken || !isPremium) return;
    loadSDK().then(() => {
      const player = new window.Spotify.Player({
        name: 'Queen City Games Music Bingo',
        getOAuthToken: cb => cb(accessToken),
        volume: 1.0,
      });
      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id);
        setIsSDKReady(true);
      });
      player.addListener('not_ready', () => setIsSDKReady(false));
      player.addListener('initialization_error', ({ message }) => setSdkError(message));
      player.addListener('authentication_error', ({ message }) => setSdkError(message));
      player.addListener('account_error', () => setSdkError('Spotify Premium required for in-browser playback.'));
      player.connect();
      playerRef.current = player;
    });
    return () => {
      playerRef.current?.disconnect();
      playerRef.current = null;
      setIsSDKReady(false);
    };
  }, [accessToken, isPremium]);

  function scheduleRefresh(expiresIn) {
    clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      const stored = sessionStorage.getItem('spotify_refresh_token');
      if (!stored || !clientId) return;
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: stored,
        client_id: clientId,
      });
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await res.json();
      if (data.access_token) {
        sessionStorage.setItem('spotify_access_token', data.access_token);
        if (data.refresh_token) sessionStorage.setItem('spotify_refresh_token', data.refresh_token);
        sessionStorage.setItem('spotify_expires_at', String(Date.now() + data.expires_in * 1000));
        setAccessToken(data.access_token);
        scheduleRefresh(data.expires_in);
      }
    }, (expiresIn - 60) * 1000);
  }

  const connect = useCallback(async () => {
    if (!clientId) { alert('Enter your Spotify Client ID in src/config.js first.'); return; }
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem('spotify_code_verifier', verifier);
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-modify-playback-state',
        'playlist-read-private',
        'playlist-read-collaborative',
      ].join(' '),
      code_challenge_method: 'S256',
      code_challenge: challenge,
    });
    window.location = `https://accounts.spotify.com/authorize?${params}`;
  }, [clientId]);

  const disconnect = useCallback(() => {
    clearTimeout(refreshTimerRef.current);
    playerRef.current?.disconnect();
    playerRef.current = null;
    sessionStorage.removeItem('spotify_access_token');
    sessionStorage.removeItem('spotify_refresh_token');
    sessionStorage.removeItem('spotify_expires_at');
    setAccessToken(null);
    setRefreshToken(null);
    setIsPremium(null);
    setIsSDKReady(false);
    setDeviceId(null);
  }, []);

  const fetchPlaylist = useCallback(async (urlOrId) => {
    if (!accessToken) throw new Error('Not authenticated');
    return fetchAllTracks(extractPlaylistId(urlOrId), accessToken);
  }, [accessToken]);

  const playTrack = useCallback(async (trackUri, positionMs) => {
    if (!accessToken || !deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ uris: [trackUri], position_ms: positionMs }),
    });
  }, [accessToken, deviceId]);

  const pausePlayback = useCallback(() => playerRef.current?.pause(), []);
  const resumePlayback = useCallback(() => playerRef.current?.resume(), []);

  const getHookStart = useCallback(async (trackId, durationMs) => {
    if (!accessToken) return Math.floor(durationMs * 0.4);
    return detectHookStart(trackId, durationMs, accessToken);
  }, [accessToken]);

  return {
    isAuthenticated: !!accessToken,
    isPremium,
    isSDKReady,
    sdkError,
    connect,
    disconnect,
    fetchPlaylist,
    playTrack,
    pausePlayback,
    resumePlayback,
    getHookStart,
  };
}
