import axios from 'axios';

const apiClient = axios.create({
  // Sử dụng biến môi trường VITE_API_URL
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/ql_giaocu', 
  headers: { 'Content-Type': 'application/json' }
});

// Tự động gắn Token vào mọi request gửi lên Backend
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Bóc tách dữ liệu và xử lý lỗi 401 (Hết hạn đăng nhập)
apiClient.interceptors.response.use(
  (response) => response.data.result, 
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/'; 
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;