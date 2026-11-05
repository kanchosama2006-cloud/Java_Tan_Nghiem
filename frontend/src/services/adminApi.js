import axiosClient from './axiosClient';

export const adminApi = {
  getDashboard: () => axiosClient.get('/admin/dashboard'),

  getOverview: () => axiosClient.get('/admin/overview'),

  // Shop Items CRUD
  getShopItems: () => axiosClient.get('/admin/shop-items'),
  createShopItem: (data) => axiosClient.post('/admin/shop-items', data),
  updateShopItem: (id, data) => axiosClient.put(`/admin/shop-items/${id}`, data),
  deleteShopItem: (id) => axiosClient.delete(`/admin/shop-items/${id}`),

  // Transactions
  getTransactions: () => axiosClient.get('/admin/transactions'),

  // Users Management
  getUsers: () => axiosClient.get('/admin/users'),
  toggleRole: (id) => axiosClient.put(`/admin/users/${id}/role`),
  adjustCoins: (id, data) => axiosClient.post(`/admin/users/${id}/coins`, data),
  resetScore: (id) => axiosClient.post(`/admin/users/${id}/reset-score`),
  deleteUser: (id) => axiosClient.delete(`/admin/users/${id}`),

  // Comments Moderation
  getComments: () => axiosClient.get('/admin/comments'),
  deleteComment: (id) => axiosClient.delete(`/admin/comments/${id}`),

  // Games Moderation
  getGames: () => axiosClient.get('/admin/games'),
  deleteGame: (id) => axiosClient.delete(`/admin/games/${id}`),
};

export default adminApi;
