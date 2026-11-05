import axiosClient from './axiosClient';

export const achievementApi = {
  getAchievements: () => axiosClient.get('/achievements'),
};

export const leaderboardApi = {
  getLeaderboard: () => axiosClient.get('/leaderboard'),
  getTop: () => axiosClient.get('/leaderboard'),
};

export const commentApi = {
  getComments: (gameId) => axiosClient.get(`/games/${gameId}/comments`),
  getByGame: (gameId) => axiosClient.get(`/games/${gameId}/comments`),
  addComment: (dataOrGameId, data) => {
    if (typeof dataOrGameId === 'object') {
      const { gameId, ...body } = dataOrGameId;
      return axiosClient.post(`/games/${gameId}/comments`, body);
    }
    return axiosClient.post(`/games/${dataOrGameId}/comments`, data);
  },
};

export const userApi = {
  updateProfile: (data) => axiosClient.put('/users/me', data),
  changePassword: (data) => axiosClient.put('/users/me/password', data),
};
