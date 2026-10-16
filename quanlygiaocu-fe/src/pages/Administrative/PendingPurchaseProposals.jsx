// src/pages/Administrative/PendingPurchaseProposals.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount || 0) + ' ₫';
const formatDateOnly = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function PendingPurchaseProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage - 1,
        size: pageSize,
        sort: 'createdAt,desc'
      };

      const response = await apiClient.get('/proposals/approved-proposals', { params });
      setProposals(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Lỗi tải danh sách chờ mua:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [currentPage, pageSize]);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH': 
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>Cao
          </span>
        );
      case 'MEDIUM': 
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Trung bình
          </span>
        );
      case 'LOW':
      default: 
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Thấp
          </span>
        );
    }
  };

  const getAvatarInitials = (fullName) => {
    if (!fullName) return 'U';
    const words = fullName.trim().split(/\s+/);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getDirectorApprovalDate = (proposal) => {
    if (!proposal.histories) return proposal.createdAt;
    const history = proposal.histories.find(h => h.action === 'APPROVED_FINAL' || h.actionLabel?.includes('duyệt chi'));
    return history ? history.createdAt : proposal.createdAt;
  };

  // Tính số liệu cho KPI
  const priorityHighCount = proposals.filter(p => p.priority === 'HIGH').length;
  // Tính tổng giá trị dự kiến của các đề xuất trên trang
  const totalEstimatedValue = proposals.reduce((sum, p) => sum + (p.estimatedTotal || 0), 0);

  return (
    <main className="flex-1 p-8 max-w-[1600px] w-full mx-auto bg-surface min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-body-sm text-outline mb-2">
        <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/administrative')}>Trang chủ</span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium">Đề xuất đã duyệt – chưa mua</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">Đề xuất đã duyệt – chưa mua</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Các đề xuất đã được Giám đốc Trung tâm duyệt chi, đang chờ Phòng hành chính thực hiện mua sắm</p>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Card 1: Cần mua */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between hover:border-outline transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">Cần mua</span>
            <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">pending</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold font-headline-xl text-on-surface leading-none">{totalElements}</span>
              <span className="text-body-sm text-on-surface-variant">đề xuất</span>
            </div>
            {totalElements > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded w-fit border border-amber-200">
                <span className="material-symbols-outlined text-[14px]">call</span>
                <span className="">Cần liên hệ NCC sớm: {Math.min(totalElements, 2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Tổng giá trị dự kiến */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between hover:border-outline transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">Tổng giá trị dự kiến</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold font-headline-xl text-on-surface leading-none">{formatCurrency(totalEstimatedValue).replace(' ₫', '')}</span>
              <span className="text-[32px] font-bold font-headline-xl text-on-surface leading-none underline decoration-2 underline-offset-4">đ</span>
            </div>
            <div className="mt-3 text-xs text-on-surface-variant font-medium bg-transparent">
              Đã được duyệt định mức ngân sách
            </div>
          </div>
        </div>

        {/* Card 3: Ưu tiên cao */}
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between hover:border-outline transition-all">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">Ưu tiên cao</span>
            <span className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">priority_high</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold font-headline-xl text-tertiary leading-none">{priorityHighCount}</span>
              <span className="text-body-sm text-on-surface-variant">đề xuất</span>
            </div>
            {priorityHighCount > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-red-700 font-medium bg-red-50 px-2 py-1 rounded w-fit border border-red-200">
                <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                <span className="">Cần mua gấp trước hạn</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DATA TABLE CONTAINER */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-[12px] font-semibold text-outline uppercase tracking-wider">
                <th className="py-3 px-4">Mã đề xuất</th>
                <th className="py-3 px-4">Người tạo</th>
                <th className="py-3 px-4">Nhóm chuyên môn</th>
                <th className="py-3 px-4">Số loại giáo cụ</th>
                <th className="py-3 px-4 text-right">Tổng chi phí dự kiến</th>
                <th className="py-3 px-4 text-center">Mức ưu tiên</th>
                <th className="py-3 px-4">Thời gian cần</th>
                <th className="py-3 px-4">Ngày GD duyệt</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-body-sm font-body-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-10 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
                    <p className="mt-2">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : proposals.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-10 text-center text-slate-500">
                    Chưa có đề xuất nào đang chờ mua sắm.
                  </td>
                </tr>
              ) : (
                proposals.map(p => {
                  const colors = ['bg-rose-100 text-rose-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700', 'bg-slate-100 text-slate-700'];
                  const colorClass = colors[p.id % colors.length] || colors[0];
                  
                  // Tính tổng số lượng sản phẩm (sp)
                  const totalSp = p.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                      <td className="py-3.5 px-4">
                        <span className="font-numeric-data font-semibold text-primary">{p.code}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${colorClass}`}>
                            {getAvatarInitials(p.creatorName)}
                          </div>
                          <div>
                            <p className="font-medium text-on-surface leading-tight">{p.creatorName}</p>
                            <p className="text-[11px] text-outline">{p.creatorPosition}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-container text-on-surface">
                          {p.creatorGroupName || 'Đang cập nhật'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-on-surface">
                        <span className="font-medium">{p.items?.length || 0} loại</span> <span className="text-outline text-xs">({totalSp} sp)</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-numeric-data font-bold text-on-surface">
                        {formatCurrency(p.estimatedTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getPriorityBadge(p.priority)}
                      </td>
                      <td className={`py-3.5 px-4 font-medium font-numeric-data ${p.priority === 'HIGH' ? 'text-red-600' : 'text-on-surface'}`}>
                        {formatDateOnly(p.requiredDate)}
                      </td>
                      <td className="py-3.5 px-4 text-on-surface-variant font-numeric-data">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                          <span className="">{formatDateOnly(getDirectorApprovalDate(p))}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button 
                          onClick={() => navigate(`/administrative/proposal-detail/${p.id}`)}
                          className="px-2.5 py-1.5 rounded-lg border border-primary text-primary hover:bg-surface-container text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          <span className="">Xem chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && proposals.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-t border-outline-variant bg-surface-container-lowest text-body-sm text-on-surface-variant gap-3">
            <div className="flex items-center gap-2">
              <span className="">Hiển thị</span>
              <select 
                value={pageSize}
                onChange={(e) => {setPageSize(Number(e.target.value)); setCurrentPage(1);}}
                className="h-8 px-2 rounded border border-outline-variant bg-white text-on-surface text-xs focus:border-primary outline-none"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
              </select>
              <span className="">trong tổng số <strong className="text-on-surface">{totalElements}</strong> đề xuất</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`w-8 h-8 rounded border border-outline-variant flex items-center justify-center text-outline ${currentPage === 1 ? 'cursor-not-allowed bg-slate-50' : 'hover:bg-surface-container-low cursor-pointer'}`}
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              
              <button className="w-8 h-8 rounded bg-primary text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                {currentPage}
              </button>
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0} 
                className={`w-8 h-8 rounded border border-outline-variant flex items-center justify-center text-outline ${currentPage === totalPages || totalPages === 0 ? 'cursor-not-allowed bg-slate-50' : 'hover:bg-surface-container-low cursor-pointer'}`}
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}