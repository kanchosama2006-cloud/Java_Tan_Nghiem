import axiosClient from './axiosClient';

export const roomApi = {
  getWaitingRooms: () => axiosClient.get('/rooms'),

  getRoom: (roomCode) => axiosClient.get(`/rooms/${roomCode}`),

  createRoom: (data) => axiosClient.post('/rooms', data),

  joinRoom: (roomCode) => axiosClient.post(`/rooms/${roomCode}/join`),

  makeMove: (roomCode, move) => axiosClient.post(`/rooms/${roomCode}/move`, move),

  setReady: (roomCode, ready = true) =>
    axiosClient.post(`/rooms/${roomCode}/ready`, null, { params: { ready } }),

  leaveRoom: (roomCode) => axiosClient.post(`/rooms/${roomCode}/leave`),
};

export default roomApi;
