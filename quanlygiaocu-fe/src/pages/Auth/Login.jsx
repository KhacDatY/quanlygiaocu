import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Reset lỗi
    
    try {
      // Đợi AuthContext xử lý gọi API
      const user = await login(username, password);
      
      // XỬ LÝ ĐIỀU HƯỚNG DỰA TRÊN ROLE CỦA BACKEND
      switch (user.role) {
        case 'TEACHER':
          // Theo yêu cầu hiện tại, Teacher sẽ bay thẳng vào trang Tạo Proposal
          navigate('/teacher/create-proposal');
          break;
        case 'MANAGER':
          navigate('/manager'); // Các role này sẽ triển khai sau
          break;
        case 'ACCOUNTANT':
          navigate('/accountant');
          break;
        case 'DIRECTOR':
          navigate('/director');
          break;
        case 'ADMINISTRATIVE_STAFF':
          navigate('/administrative');
          break;
        case 'ADMIN':
          // Thêm case cho ADMIN, điều hướng tới trang quản trị của Admin
          navigate('/admin'); // Hoặc đường dẫn bất kỳ mà bạn muốn Admin thấy sau khi login
          break;
        default:
          setError('Tài khoản không được phân quyền truy cập.');
          break;
      }
      
    } catch (err) {
      // Backend (ErrorCode.java) có thể trả về thông báo lỗi, ta bắt và hiển thị
      setError(err.message || 'Sai tên đăng nhập hoặc mật khẩu. Vui lòng thử lại!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant overflow-hidden">
        <div className="bg-primary p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-white">school</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">EduProcure</h1>
          <p className="text-primary-fixed-dim text-sm mt-1">Hệ thống quản lý giáo cụ</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Hiển thị lỗi nếu có */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên đăng nhập</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-surface rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Ví dụ: dangmailan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 bg-surface rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Nhập 12345678"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 mt-4 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                loading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-container'
              }`}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">login</span>
                  <span>Đăng nhập hệ thống</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}