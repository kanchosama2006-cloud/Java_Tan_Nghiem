import axiosClient from './axiosClient';

export const roomApi = {
  getWaitingRooms: () => axiosClient.get('/rooms/waiting'),

  getRoom: (roomCode) => axiosClient.get(`/rooms/${roomCode}`),

  createRoom: (data) => axiosClient.post('/rooms', data),

  joinRoom: (roomCode) => axiosClient.post(`/rooms/${roomCode}/join`),

  makeMove: (roomCode, move) => axiosClient.post(`/rooms/${roomCode}/move`, move),
};

export default roomApi;
