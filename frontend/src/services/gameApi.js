import axiosClient from './axiosClient';

export const gameApi = {
  getGames: () => axiosClient.get('/games'),

  getGame: (id) => axiosClient.get(`/games/${id}`),

  saveGame: (data) => axiosClient.post('/games', data),

  updateGameNames: (id, data) => axiosClient.put(`/games/${id}`, data),

  deleteGame: (id) => axiosClient.delete(`/games/${id}`),

  getBotMove: (data) => axiosClient.post('/games/bot-move', data),

  getMyScore: () => axiosClient.get('/scores/me'),
};

export default gameApi;
