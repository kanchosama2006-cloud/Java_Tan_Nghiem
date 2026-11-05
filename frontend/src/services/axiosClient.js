import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor: chuẩn hóa xử lý lỗi từ Spring Boot GlobalExceptionHandler
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Có lỗi xảy ra, vui lòng thử lại sau';
    let fieldErrors = null;
    let status = error.response ? error.response.status : 500;

    if (error.response && error.response.data) {
      const data = error.response.data;
      if (data.message) {
        message = data.message;
      }
      if (data.fieldErrors) {
        fieldErrors = data.fieldErrors;
      }
    } else if (error.message) {
      message = error.message;
    }

    const customError = new Error(message);
    customError.status = status;
    customError.fieldErrors = fieldErrors;
    customError.original = error;

    return Promise.reject(customError);
  }
);

export default axiosClient;
