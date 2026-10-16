import { useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function MainLayout({ role }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getMenuItems = () => {
    // Nếu là Giáo viên
    if (user?.role === 'TEACHER') {
      return [
        { path: '/teacher/create-proposal', icon: 'add_circle', label: 'Tạo đề xuất mua sắm' },
        { path: '/teacher/my-proposals', icon: 'pending_actions', label: 'Đề xuất của tôi' },
      ];
    }
    
    // Nếu là Manager (Trưởng nhóm chuyên môn)
    if (user?.role === 'MANAGER' || user?.role === 'ACADEMIC_MANAGER') {
      return [
        { path: '/manager/pending', icon: 'pending_actions', label: 'Danh sách đề xuất chờ duyệt' },
        { path: '/manager/history', icon: 'history', label: 'Lịch sử duyệt' }, // Làm sau
      ];
    }

    if (user?.role === 'ACCOUNTANT') {
      return [
        { path: '/accountant/pending-budget', icon: 'account_balance_wallet', label: 'Phê duyệt ngân sách' },
        { path: '/accountant/history', icon: 'bar_chart', label: 'Báo cáo ngân sách' }, // Tạm thời để sẵn cho sau này
      ];
    }

    if (user?.role === 'DIRECTOR') {
      return [
        { path: '/director/pending-approvals', icon: 'pending_actions', label: 'Đề xuất chờ duyệt chi' },
        { path: '/director/history', icon: 'history', label: 'Lịch sử duyệt' },
      ];
    }

    if (user?.role === 'ADMINISTRATIVE_STAFF') {
      return [
        { 
          path: '/administrative/dashboard', // (Nếu có trang tổng quan)
          icon: 'dashboard', 
          label: 'Tổng quan' 
        },
        { 
          path: '/administrative/pending-purchases', 
          icon: 'fact_check', // Hoặc 'shopping_bag' theo thiết kế của bạn
          label: 'Đã duyệt – chưa mua' 
        },
      ];
    }

    // Role khác (Kế toán, Giám đốc...) thêm sau
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-background text-on-surface font-body-md antialiased overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 h-full bg-surface-container-lowest border-r border-outline-variant flex flex-col justify-between p-4 shrink-0 shadow-sm z-40">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-primary font-bold leading-tight">EduProcure</span>
              <span className="font-caption text-on-surface-variant">Hệ thống giáo cụ</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive = location.pathname.includes(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    isActive 
                      ? 'bg-surface-container text-primary font-semibold border-l-4 border-primary' 
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${isActive ? 'fill' : ''}`} style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>
                    {item.icon}
                  </span>
                  <span className="font-label-md">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="border-t border-outline-variant/40 pt-4 flex flex-col gap-1">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-left">
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-label-md">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-surface-container-lowest border-b border-outline-variant shadow-sm flex items-center justify-end px-6 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg">
              <span className="material-symbols-outlined text-2xl">notifications</span>
            </button>
            <div className="h-6 w-px bg-outline-variant/60"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-label-md text-on-surface font-semibold leading-tight">{user?.fullName || 'Người dùng'}</span>
                <span className="font-caption text-on-surface-variant">{user?.position || 'Giáo viên'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT (Thay đổi theo Route) */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}