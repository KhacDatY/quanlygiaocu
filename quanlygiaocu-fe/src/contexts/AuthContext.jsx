import { createContext, useState } from 'react';
import apiClient from '../api/apiClient'; // Import apiClient đã tạo

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Lấy user từ localStorage nếu đã đăng nhập trước đó
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      // 1. Gọi API Backend để xác thực và lấy Token
      const authRes = await apiClient.post('/auth/log-in', { username, password });
      
      // Lưu token vào localStorage để apiClient tự động gắn vào Header các request sau
      localStorage.setItem('token', authRes.token);

      // 2. Gọi API lấy thông tin chi tiết của User (Tên, Role, Group...)
      const userInfo = await apiClient.get('/users/my-info');
      
      // Lưu thông tin user vào Context và localStorage
      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
      
      return userInfo; // Trả về để trang Login điều hướng
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};