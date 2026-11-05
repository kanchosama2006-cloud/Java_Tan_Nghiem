import axiosClient from './axiosClient';

export const shopApi = {
  getItems: (category, search) =>
    axiosClient.get('/shop/items', {
      params: {
        category: category && category !== 'ALL' ? category : undefined,
        search: search ? search : undefined,
      },
    }),

  buyItem: (itemId) => axiosClient.post(`/shop/buy/${itemId}`),

  equipItem: (itemId) => axiosClient.post(`/shop/equip/${itemId}`),

  getMyEquipped: () => axiosClient.get('/shop/my-equipped'),

  getTransactions: () => axiosClient.get('/shop/transactions'),
};

export default shopApi;
