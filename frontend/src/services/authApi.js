import axiosClient from './axiosClient';

export const authApi = {
  login: (username, password) =>
    axiosClient.post('/auth/login', { username, password }),

  register: (username, password, fullName) =>
    axiosClient.post('/auth/register', { username, password, fullName }),

  logout: () =>
    axiosClient.post('/auth/logout'),

  loginGoogle: (idToken) =>
    axiosClient.post('/auth/google', { idToken }),

  getMe: () =>
    axiosClient.get('/auth/me'),
};

export default authApi;
