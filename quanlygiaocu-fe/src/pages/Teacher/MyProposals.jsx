import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function MyProposals() {
  const navigate = useNavigate();
  const location = useLocation(); // Nhận state từ trang Create chuyển sang (nếu có)
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  // States cho Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // States cho Bộ lọc
  const [filters, setFilters] = useState({
    status: 'all',
    searchCode: '',
  });

  // Fetch dữ liệu từ Backend
  const fetchProposals = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.searchCode) params.code = filters.searchCode;
      
      const response = await apiClient.get('/proposals/my-proposals', { params });
      setProposals(response || []);
      setCurrentPage(1); // Reset về trang 1 khi lọc
    } catch (error) {
      console.error('Lỗi khi tải danh sách đề xuất:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Xử lý Lọc & Làm mới
  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchProposals();
  };

  const handleResetFilter = () => {
    setFilters({ status: 'all', searchCode: '' });
    // Tự động gọi lại API sau khi state reset (trong thực tế có thể dùng useEffect cho filter, nhưng gọi trực tiếp cho đơn giản)
    setTimeout(() => {
      apiClient.get('/proposals/my-proposals').then(res => setProposals(res || []));
      setCurrentPage(1);
    }, 0);
  };

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = proposals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(proposals.length / itemsPerPage);

  const displayStart = proposals.length === 0 ? 0 : indexOfFirstItem + 1;
  const displayEnd = Math.min(indexOfLastItem, proposals.length);

  // Tiện ích Format Ngày
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return { date: '', time: '' };
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  // Ánh xạ Mức độ ưu tiên
  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'HIGH':
        return { text: 'Cao', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-error' };
      case 'MEDIUM':
        return { text: 'Trung bình', color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
      case 'LOW':
        return { text: 'Thấp', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
      default:
        return { text: priority, color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
    }
  };

  // Ánh xạ Trạng thái đề xuất
  const getStatusConfig = (status) => {
    switch (status) {
      case 'PENDING_MANAGER': return { text: 'Chờ duyệt nhu cầu', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-600', rowBg: '' };
      case 'PENDING_ACCOUNTANT': return { text: 'Chờ kiểm tra ngân sách', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-600', rowBg: '' };
      case 'PENDING_DIRECTOR': return { text: 'Chờ GĐ duyệt chi', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-600', rowBg: '' };
      case 'NEEDS_REVISION': return { text: 'Yêu cầu chỉnh sửa', color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-600', rowBg: 'bg-amber-50/20' };
      case 'REJECTED': return { text: 'Bị từ chối', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-error', rowBg: 'bg-red-50/20' };
      case 'APPROVED': return { text: 'Đã duyệt (Chờ mua)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-secondary', rowBg: '' };
      case 'PURCHASING': return { text: 'Đang mua hàng', color: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-600', rowBg: '' };
      case 'COMPLETED': return { text: 'Hoàn tất bàn giao', color: 'bg-green-50 text-green-800 border-green-200', dot: 'bg-green-600', rowBg: '' };
      case 'DRAFT': return { text: 'Bản nháp', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-500', rowBg: '' };
      default: return { text: status, color: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-400', rowBg: '' };
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
        {/* Breadcrumb Hierarchy */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-3 font-caption text-caption text-on-surface-variant">
          <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/teacher')}>Trang chủ</span>
          <span className="material-symbols-outlined text-xs text-outline">chevron_right</span>
          <span className="font-semibold text-primary">Đề xuất của tôi</span>
        </nav>

        {/* Page Header Banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Đề xuất của tôi</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Theo dõi và quản lý các đề xuất mua sắm giáo cụ</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/teacher/create-proposal')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-container text-white hover:text-on-primary rounded-xl font-label-md text-label-md shadow-sm transition-all duration-150 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Tạo đề xuất mới</span>
            </button>
          </div>
        </div>

        {/* Filter Bar Card */}
        <section className="bg-surface-container-lowest rounded-xl p-5 mb-6 shadow-sm border border-outline-variant/60">
          <form className="flex flex-col lg:flex-row lg:items-end gap-4" onSubmit={handleApplyFilter}>
            <div className="flex-1 min-w-[200px]">
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Trạng thái</label>
              <div className="relative">
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full bg-surface-bright border border-outline-variant rounded-lg px-3.5 py-2.5 text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none pr-10"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="PENDING_MANAGER">Chờ duyệt nhu cầu</option>
                  <option value="PENDING_ACCOUNTANT">Chờ KT duyệt ngân sách</option>
                  <option value="NEEDS_REVISION">Yêu cầu chỉnh sửa</option>
                  <option value="REJECTED">Bị từ chối</option>
                  <option value="APPROVED">Đã duyệt</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-outline text-base pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="flex-1 min-w-[240px]">
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5">Tìm mã đề xuất</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-base pointer-events-none">search</span>
                <input 
                  type="text" 
                  value={filters.searchCode}
                  onChange={(e) => setFilters({...filters, searchCode: e.target.value})}
                  placeholder="Nhập mã (VD: DX-2026-...)" 
                  className="w-full bg-surface-bright border border-outline-variant rounded-lg pl-9 pr-3.5 py-2 text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 lg:pt-0">
              <button type="submit" className="px-5 py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary hover:text-white shadow-sm transition-all duration-150 active:scale-95">
                Áp dụng
              </button>
              <button type="button" onClick={handleResetFilter} className="px-4 py-2 border border-primary text-primary bg-surface-container-lowest hover:bg-surface-container-low rounded-lg font-label-md text-label-md transition-all duration-150 active:scale-95">
                Làm mới
              </button>
            </div>
          </form>
        </section>

        {/* Proposals Data Table Card */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/40 flex items-center justify-between bg-surface-bright">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">list_alt</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Danh sách yêu cầu mua sắm</h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary text-caption font-bold">{proposals.length} đề xuất</span>
            </div>
          </div>

          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md border-b border-outline-variant/50">
                  <th className="py-3 px-4 font-semibold text-left">Mã đề xuất</th>
                  <th className="py-3 px-4 font-semibold text-left">Số loại giáo cụ</th>
                  <th className="py-3 px-4 font-semibold text-left">Tổng chi phí dự kiến</th>
                  <th className="py-3 px-4 font-semibold text-left">Mức độ ưu tiên</th>
                  <th className="py-3 px-4 font-semibold text-left">Thời gian cần</th>
                  <th className="py-3 px-4 font-semibold text-left">Ngày tạo</th>
                  <th className="py-3 px-4 font-semibold text-left">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-body-sm font-body-sm">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
                      <p className="mt-2">Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-5xl text-outline mb-3">inventory_2</span>
                      <p className="text-body-lg">Không tìm thấy đề xuất nào.</p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((proposal) => {
                    const statusConfig = getStatusConfig(proposal.status);
                    const priorityConfig = getPriorityConfig(proposal.priority);
                    const { date: createDate, time: createTime } = formatDateTime(proposal.createdAt);

                    return (
                      <tr key={proposal.id} className={`hover:bg-surface-container-low/60 cursor-pointer transition-colors duration-150 ${statusConfig.rowBg}`}>
                        <td className="py-3.5 px-4 font-semibold text-primary hover:underline font-mono">
                          {proposal.code}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface">
                          <div className="font-medium">{proposal.items?.length || 0} danh mục</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-on-surface font-numeric-data">
                          {proposal.estimatedTotal?.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${priorityConfig.color} font-label-sm text-label-sm`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig.dot}`}></span>
                            <span>{priorityConfig.text}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-on-surface font-numeric-data">
                          {formatDate(proposal.requiredDate)}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant font-numeric-data">
                          {createDate} <span className="text-caption text-outline block text-[11px]">{createTime}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.color} font-label-sm text-label-sm`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                            <span>{statusConfig.text}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {proposal.status === 'NEEDS_REVISION' ? (
                            <button 
                              onClick={() => navigate(`/teacher/need-edit-proposal-detail/${proposal.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300 font-label-md text-label-md hover:bg-amber-200 transition-colors"
                              title="Chỉnh sửa đề xuất"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                              <span>Chỉnh sửa</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => navigate(`/teacher/proposal-detail/${proposal.id}`)}
                              className="inline-flex items-center gap-1 text-primary hover:text-primary-container font-label-md text-label-md hover:underline"
                              title="Xem chi tiết"
                            >
                              <span className="material-symbols-outlined text-base">visibility</span>
                              <span>Chi tiết</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          {!loading && proposals.length > 0 && (
            <div className="px-6 py-4 bg-surface-bright border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Hiển thị <span className="font-semibold text-on-surface">{displayStart}-{displayEnd}</span> trong tổng số <span className="font-semibold text-on-surface">{proposals.length}</span> đề xuất
              </p>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-1.5 rounded border border-outline-variant/60 text-outline ${currentPage === 1 ? 'cursor-not-allowed opacity-60' : 'hover:bg-surface-container-low hover:text-on-surface'}`}
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                
                {/* Render page numbers */}
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  // Chỉ hiển thị vài trang xung quanh trang hiện tại để UI gọn gàng nếu có nhiều trang
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <button 
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded font-label-md text-label-md flex items-center justify-center ${currentPage === pageNum ? 'bg-primary-container text-on-primary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-1 text-outline">...</span>;
                  }
                  return null;
                })}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-1.5 rounded border border-outline-variant/60 text-outline ${currentPage === totalPages ? 'cursor-not-allowed opacity-60' : 'hover:bg-surface-container-low hover:text-on-surface'}`}
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}