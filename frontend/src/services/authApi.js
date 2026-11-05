import axiosClient from './axiosClient';

export const authApi = {
  login: (username, password) =>
    axiosClient.post('/auth/login', { username, password }),

  register: (username, password, fullName) =>
    axiosClient.post('/auth/register', { username, password, fullName }),

  logout: () =>
    axiosClient.post('/auth/logout'),

  getMe: () =>
    axiosClient.get('/auth/me'),
};

export default authApi;
