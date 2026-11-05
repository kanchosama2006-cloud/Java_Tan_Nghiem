import axiosClient from './axiosClient';

export const achievementApi = {
  getAchievements: () => axiosClient.get('/achievements'),
};

export const leaderboardApi = {
  getLeaderboard: () => axiosClient.get('/leaderboard'),
};

export const commentApi = {
  getComments: (gameId) => axiosClient.get(`/games/${gameId}/comments`),
  addComment: (gameId, data) => axiosClient.post(`/games/${gameId}/comments`, data),
};

export const userApi = {
  updateProfile: (data) => axiosClient.put('/users/me', data),
  changePassword: (data) => axiosClient.put('/users/me/password', data),
};
