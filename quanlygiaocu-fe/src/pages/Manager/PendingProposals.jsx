import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function PendingProposals() {
  const navigate = useNavigate();
  
  // Dữ liệu danh sách
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dữ liệu bộ lọc động từ BE
  const [groups, setGroups] = useState([]);
  const [creators, setCreators] = useState([]);

  // States cho Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // States cho Bộ lọc
  const [filters, setFilters] = useState({
    dateRange: '',
    priority: '',
    groupId: '',
    creatorId: ''
  });

  // 1. Fetch dữ liệu Dropdown (Nhóm & Người tạo) từ BE
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [groupsRes, usersRes] = await Promise.all([
          apiClient.get('/groups'),
          apiClient.get('/users/teachers')
        ]);
        setGroups(groupsRes || []);
        setCreators(usersRes || []); 
      } catch (error) {
        console.error('Lỗi khi tải bộ lọc:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  // 2. Fetch danh sách đề xuất
  const fetchPendingProposals = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage - 1, 
        size: pageSize,
        sort: 'createdAt,desc'
      };
      
      if (filters.priority) params.priority = filters.priority;
      if (filters.groupId) params.groupId = filters.groupId;
      if (filters.creatorId) params.creatorId = filters.creatorId;

      // Xử lý tách chuỗi ngày "DD/MM/YYYY - DD/MM/YYYY" thành YYYY-MM-DD
      if (filters.dateRange) {
        const parts = filters.dateRange.split('-').map(p => p.trim());
        if (parts.length === 2) {
          const parseDate = (d) => {
            const [day, month, year] = d.split('/');
            return (day && month && year) ? `${year}-${month}-${day}` : null;
          };
          const startDate = parseDate(parts[0]);
          const endDate = parseDate(parts[1]);
          if (startDate) params.startDate = startDate;
          if (endDate) params.endDate = endDate;
        }
      }
      
      const response = await apiClient.get('/proposals/pending-manager', { params });
      
      setProposals(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Lỗi khi tải danh sách chờ duyệt:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProposals();
  }, [currentPage, pageSize]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPendingProposals();
  };

  const handleResetFilter = () => {
    setFilters({ dateRange: '', priority: '', groupId: '', creatorId: '' });
    setCurrentPage(1);
    setTimeout(() => fetchPendingProposals(), 0);
  };

  // Tiện ích format
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return { date: '', time: '' };
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  const getAvatarInitials = (fullName) => {
    if (!fullName) return 'U';
    const words = fullName.trim().split(/\s+/);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getSLAInfo = (createdAt) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = Math.abs(now - createdDate);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = (diffMs / (1000 * 60 * 60 * 24)).toFixed(1);
    const isOverdue = parseFloat(diffDays) > 2;

    return { hours: diffHours, days: parseFloat(diffDays), isOverdue };
  };

  const renderSLABadge = (createdAt) => {
    const sla = getSLAInfo(createdAt);

    if (sla.isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-tertiary-fixed text-tertiary border border-tertiary-fixed-dim w-fit">
          <span className="material-symbols-outlined text-[12px]">schedule</span> Quá hạn: {sla.days} ngày
        </span>
      );
    }
    if (sla.hours < 24) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-primary border border-outline-variant w-fit">
          <span className="material-symbols-outlined text-[12px]">timelapse</span> {Math.max(1, sla.hours)} giờ trước
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-primary border border-outline-variant w-fit">
        <span className="material-symbols-outlined text-[12px]">timelapse</span> {sla.days} ngày trước
      </span>
    );
  };

  const overdueCount = proposals.filter(p => getSLAInfo(p.createdAt).isOverdue).length;

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-error-container text-error border border-tertiary-fixed-dim">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>local_fire_department</span> Ưu tiên cao
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="material-symbols-outlined text-[13px]">schedule</span> Trung bình
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant border border-outline-variant">
            <span className="material-symbols-outlined text-[13px]">low_priority</span> Tiêu chuẩn
          </span>
        );
      default: return null;
    }
  };

  const displayStart = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const displayEnd = Math.min(currentPage * pageSize, totalElements);

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="max-w-[1600px] mx-auto space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-headline-md font-headline-md font-bold text-on-surface">Danh sách đề xuất chờ duyệt</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed">{totalElements} đang chờ</span>
            </div>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">Các đề xuất đang ở trạng thái Chờ duyệt đề xuất thuộc phạm vi quản lý của bạn</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-outline transition-colors">
            <div className="space-y-1">
              <span className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">pending_actions</span> Cần xử lý
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-headline-lg font-headline-lg font-bold text-primary">{totalElements}</span>
                <span className="text-body-sm font-body-sm text-on-surface-variant">Đề xuất</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">fact_check</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-tertiary-fixed-dim rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-error transition-colors bg-gradient-to-r from-surface-container-lowest to-surface-container-low">
            <div className="space-y-1">
              <span className="text-label-sm font-label-sm text-error flex items-center gap-1.5 font-semibold">
                <span className="material-symbols-outlined text-[16px] text-error">timer</span> Cảnh báo SLA
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-headline-lg font-headline-lg font-bold text-error">{overdueCount}</span>
                <span className="text-body-sm font-body-sm text-tertiary font-medium">Đề xuất quá hạn (&gt;2 ngày)</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-error-container flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
          </div>
        </div>

        {/* ADVANCED FILTER CONTROLS */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4">
          <form onSubmit={handleApplyFilter} className="flex flex-col xl:flex-row xl:items-end gap-3">
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-label-sm font-label-sm text-on-surface font-medium mb-1.5">Khoảng ngày tạo</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-base">calendar_today</span>
                </span>
                <input 
                  type="text" 
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                  placeholder="Từ ngày - Đến ngày"
                  className="w-full h-9 pl-9 pr-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="block text-label-sm font-label-sm text-on-surface font-medium mb-1.5">Mức ưu tiên</label>
              <div className="relative">
                <select 
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                  className="w-full h-9 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm text-on-surface focus:outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="">Tất cả mức độ</option>
                  <option value="HIGH">Ưu tiên Cao</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="LOW">Tiêu chuẩn</option>
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-base">arrow_drop_down</span>
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-label-sm font-label-sm text-on-surface font-medium mb-1.5">Nhóm chuyên môn</label>
              <div className="relative">
                <select 
                  value={filters.groupId}
                  onChange={(e) => setFilters({...filters, groupId: e.target.value})}
                  className="w-full h-9 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm text-on-surface focus:outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="">Tất cả khối</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-base">arrow_drop_down</span>
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-label-sm font-label-sm text-on-surface font-medium mb-1.5">Người tạo</label>
              <div className="relative">
                <select 
                  value={filters.creatorId}
                  onChange={(e) => setFilters({...filters, creatorId: e.target.value})}
                  className="w-full h-9 pl-3 pr-8 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm text-on-surface focus:outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="">Tất cả giáo viên</option>
                  {creators.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.username})</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-base">arrow_drop_down</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 xl:mt-0 w-full xl:w-auto shrink-0">
              <button type="button" onClick={handleResetFilter} className="h-9 px-4 rounded-lg border border-outline-variant hover:bg-surface-container-low text-on-surface-variant font-label-md transition-colors flex items-center justify-center gap-1 cursor-pointer w-full xl:w-auto">
                <span className="material-symbols-outlined text-[18px]">restart_alt</span> Làm mới
              </button>
              <button type="submit" className="h-9 px-5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer w-full xl:w-auto">
                <span className="material-symbols-outlined text-[18px]">filter_list</span> Áp dụng lọc
              </button>
            </div>
          </form>
        </div>

        {/* DATA TABLE */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="py-3.5 px-3 text-caption font-caption uppercase tracking-wider text-on-surface-variant font-semibold">Mã đề xuất</th>
                  <th className="py-3.5 px-4 text-caption font-caption uppercase tracking-wider text-on-surface-variant font-semibold">Người tạo</th>
                  <th className="py-3.5 px-3 text-caption font-caption uppercase tracking-wider text-on-surface-variant font-semibold">Khối chuyên môn</th>
                  <th className="py-3.5 px-4 text-caption font-caption uppercase tracking-wider text-on-surface-variant font-semibold">Giáo cụ đề xuất</th>
                  <th className="py-3.5 px-4 text-caption font-caption uppercase tracking-wider text-on-surface-variant font-semibold text-right">Tổng chi phí</th>
                  <th className="py-3.5 px-3 text-caption font-caption uppercase tracking-wider text-on-surface-variant font-semibold">Ưu tiên</th>
                  <th className="py-3.5 px-4 text-caption font-caption uppercase tracking-wider text-on-surface-variant font-semibold">Ngày tạo & SLA</th>
                  <th className="py-3.5 px-4 text-caption font-caption uppercase tracking-wider text-on-surface-variant font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-body-sm font-body-sm">
                {loading ? (
                   <tr>
                     <td colSpan="8" className="py-10 text-center text-on-surface-variant">
                       <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
                       <p className="mt-2">Đang tải dữ liệu...</p>
                     </td>
                   </tr>
                ) : proposals.length === 0 ? (
                   <tr>
                     <td colSpan="8" className="py-10 text-center text-on-surface-variant">
                       Không có đề xuất nào đang chờ duyệt.
                     </td>
                   </tr>
                ) : (
                  proposals.map((p) => {
                    const { date, time } = formatDateTime(p.createdAt);

                    return (
                      <tr key={p.id} className="bg-surface-container-low/60 hover:bg-surface-container transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-numeric-data font-bold text-primary">{p.code}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs uppercase">
                              {getAvatarInitials(p.creatorName)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-label-md text-label-md text-on-surface font-semibold">{p.creatorName}</span>
                              <span className="text-caption font-caption text-on-surface-variant">{p.creatorPosition}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-high text-primary border border-outline-variant">
                            {p.creatorGroupName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col max-w-xs">
                            <span className="font-medium text-on-surface truncate">{p.items?.[0]?.name || 'Chưa rõ'} {p.items?.length > 1 ? ', ...' : ''}</span>
                            <span className="text-caption font-caption text-on-surface-variant">{p.items?.length || 0} danh mục giáo cụ</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-numeric-data font-bold text-on-surface text-[14px]">{p.estimatedTotal?.toLocaleString('vi-VN')} ₫</span>
                        </td>
                        <td className="py-3.5 px-3">
                          {getPriorityBadge(p.priority)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-on-surface-variant font-numeric-data text-xs">{date} {time}</span>
                            {renderSLABadge(p.createdAt)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button 
                            onClick={() => navigate(`/manager/proposal-detail/${p.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-surface-container font-label-md text-label-md transition-colors cursor-pointer shadow-2xs"
                          >
                            <span>Xem xét</span>
                            <span className="material-symbols-outlined text-base">arrow_forward</span>
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
            <div className="px-6 py-3.5 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 text-body-sm text-on-surface-variant">
              <div className="flex items-center gap-4">
                <span>Hiển thị <strong className="text-on-surface">{displayStart} - {displayEnd}</strong> của <strong className="text-on-surface">{totalElements}</strong> đề xuất</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">Xem:</span>
                  <select 
                    value={pageSize} 
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="h-8 px-2 bg-surface-container-lowest border border-outline-variant rounded text-xs text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="10">10 bản ghi / trang</option>
                    <option value="20">20 bản ghi / trang</option>
                    <option value="50">50 bản ghi / trang</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-1.5 rounded border border-outline-variant bg-surface-container-lowest text-outline ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-container-low cursor-pointer'}`}
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNumber = idx + 1;
                  return (
                    <button 
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-8 h-8 rounded font-numeric-data font-semibold text-xs flex items-center justify-center ${currentPage === pageNumber ? 'bg-primary text-on-primary' : 'hover:bg-surface-container text-on-surface'}`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-1.5 rounded border border-outline-variant bg-surface-container-lowest text-on-surface ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed text-outline' : 'hover:bg-surface-container-low cursor-pointer'}`}
                >
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}