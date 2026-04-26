export const GAME_NAME = 'Musical Bingo';
export const COMPANY_NAME = 'Queen City Games';
export const SPOTIFY_CLIENT_ID = '8959779441e048de97c586c1a06ac2a1';
export const REDIRECT_URI = typeof window !== 'undefined' && window.location.hostname !== '127.0.0.1'
  ? 'https://jmurdocks.github.io/SongBingo'
  : 'http://127.0.0.1:5173';

export const COLORS = {
  navy: '#12005e',
  purple: '#6200ea',
  purpleLight: '#a040ff',
  purpleSoft: '#c5a8f5',
  purplePale: '#f0eeff',
  gradient: 'linear-gradient(135deg, #12005e, #6200ea)',
};
