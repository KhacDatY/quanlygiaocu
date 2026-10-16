// src/pages/Accountant/PendingBudgetProposals.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function PendingBudgetProposals() {
  const navigate = useNavigate();
  
  // Dữ liệu danh sách
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dữ liệu cho Dropdown bộ lọc
  const [groups, setGroups] = useState([]);
  const [creators, setCreators] = useState([]);

  // States Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // States lưu giá trị đang NHẬP trong form lọc
  const [filterInput, setFilterInput] = useState({
    startDate: '',
    endDate: '',
    priority: '',
    groupId: '',
    creatorId: ''
  });

  // States lưu giá trị ĐÃ ÁP DỤNG
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: '',
    endDate: '',
    priority: '',
    groupId: '',
    creatorId: ''
  });

  useEffect(() => {
    const fetchOptions = async () => {
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
    fetchOptions();
  }, []);

  const fetchPendingProposals = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage - 1, 
        size: pageSize,
        sort: 'createdAt,asc' 
      };
      
      if (appliedFilters.priority) params.priority = appliedFilters.priority;
      if (appliedFilters.groupId) params.groupId = appliedFilters.groupId;
      if (appliedFilters.creatorId) params.creatorId = appliedFilters.creatorId;
      if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
      if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;

      const response = await apiClient.get('/proposals/pending-accountant', { params });
      
      setProposals(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Lỗi tải danh sách chờ ngân sách:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProposals();
  }, [currentPage, pageSize, appliedFilters]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setAppliedFilters({ ...filterInput });
    setCurrentPage(1);
  };

  const removeFilter = (key) => {
    const updatedFilters = { ...appliedFilters, [key]: '' };
    setAppliedFilters(updatedFilters);
    setFilterInput(updatedFilters);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    const emptyFilters = { startDate: '', endDate: '', priority: '', groupId: '', creatorId: '' };
    setAppliedFilters(emptyFilters);
    setFilterInput(emptyFilters);
    setCurrentPage(1);
  };

  const getActiveFilterTags = () => {
    const tags = [];
    if (appliedFilters.startDate || appliedFilters.endDate) {
      tags.push({ key: 'date', label: `Ngày tạo: ${appliedFilters.startDate || '...'} đến ${appliedFilters.endDate || '...'}` });
    }
    if (appliedFilters.priority) {
      const prioName = appliedFilters.priority === 'HIGH' ? 'Cao' : appliedFilters.priority === 'MEDIUM' ? 'Trung bình' : 'Thấp';
      tags.push({ key: 'priority', label: `Ưu tiên: ${prioName}` });
    }
    if (appliedFilters.groupId) {
      const groupName = groups.find(g => g.id === appliedFilters.groupId)?.name || '...';
      tags.push({ key: 'groupId', label: `Nhóm: ${groupName}` });
    }
    if (appliedFilters.creatorId) {
      const creatorName = creators.find(c => c.id === appliedFilters.creatorId)?.fullName || '...';
      tags.push({ key: 'creatorId', label: `Người tạo: ${creatorName}` });
    }
    return tags;
  };

  const activeTags = getActiveFilterTags();

  // --- Helpers ---
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return { date: '', time: '' };
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-caption font-semibold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
          <span className="material-symbols-outlined text-[13px]">warning</span> Quá hạn SLA (+{Math.floor(sla.days - 2)} ngày)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-caption font-semibold bg-green-50 text-green-700 border border-green-200 w-fit">
        <span className="material-symbols-outlined text-[13px]">check_circle</span> Đúng hạn SLA
      </span>
    );
  };

  const overdueCount = proposals.filter(p => getSLAInfo(p.createdAt).isOverdue).length;

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-semibold bg-red-50 text-red-700 border border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Cao</span>;
      case 'MEDIUM': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-semibold bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Trung bình</span>;
      case 'LOW': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-semibold bg-slate-100 text-slate-700 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Thấp</span>;
      default: return null;
    }
  };

  const displayStart = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const displayEnd = Math.min(currentPage * pageSize, totalElements);

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6 pb-20">
        
        {/* BREADCRUMB & HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-caption font-caption text-on-surface-variant mb-1">
              <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/')}>Trang chủ</span>
              <span className="material-symbols-outlined text-[12px] text-outline">chevron_right</span>
              <span className="text-primary font-semibold">Phê duyệt ngân sách</span>
            </div>
            <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">Danh sách đề xuất chờ phê duyệt ngân sách</h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
              Các đề xuất đã được Quản lý duyệt nhu cầu, đang chờ Kế toán xác nhận trước khi chuyển Giám đốc duyệt chi
            </p>
          </div>
        </div>

        {/* KPI METRICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-surface-container-low/50 pointer-events-none"></div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-body-sm font-medium text-on-surface-variant">Cần xử lý</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-headline-xl font-bold text-primary">{totalElements}</span>
                  <span className="text-label-md text-on-surface-variant">đề xuất</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">assignment</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-caption font-caption text-on-surface-variant">
              <span>Đang ở bước Kiểm tra tài chính</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-tertiary-fixed-dim p-4 shadow-sm flex flex-col justify-between relative overflow-hidden bg-gradient-to-r from-surface-container-lowest to-error-container/10">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-error-container/30 pointer-events-none"></div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-body-sm font-medium text-error flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">timer</span>Cảnh báo SLA</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-headline-xl font-bold text-error">{overdueCount}</span>
                  <span className="text-label-md text-tertiary">đề xuất trễ hạn</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-error-container flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-surface-container flex items-center justify-between text-caption font-caption text-error font-medium">
              <span>&gt; 2 ngày làm việc chưa xử lý</span>
            </div>
          </div>
        </div>

        {/* FILTER TOOLBAR */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 shadow-sm flex flex-col gap-3">
          <form onSubmit={handleApplyFilter} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            
            <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
              <label className="text-caption font-medium text-on-surface-variant">Từ ngày tạo</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">calendar_today</span>
                <input 
                  type="date" 
                  value={filterInput.startDate} onChange={e => setFilterInput({...filterInput, startDate: e.target.value})}
                  className="w-full h-9 pl-9 pr-3 text-body-sm rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
              <label className="text-caption font-medium text-on-surface-variant">Đến ngày tạo</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">calendar_today</span>
                <input 
                  type="date" 
                  value={filterInput.endDate} onChange={e => setFilterInput({...filterInput, endDate: e.target.value})}
                  className="w-full h-9 pl-9 pr-3 text-body-sm rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-caption font-medium text-on-surface-variant">Mức ưu tiên</label>
              <select value={filterInput.priority} onChange={e => setFilterInput({...filterInput, priority: e.target.value})} className="w-full h-9 px-3 text-body-sm rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                <option value="">Tất cả mức độ</option>
                <option value="HIGH">Ưu tiên Cao</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="LOW">Thấp</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-caption font-medium text-on-surface-variant">Nhóm CM</label>
              <select value={filterInput.groupId} onChange={e => setFilterInput({...filterInput, groupId: e.target.value})} className="w-full h-9 px-3 text-body-sm rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                <option value="">Tất cả nhóm</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <button type="submit" className="flex-1 h-9 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[16px]">filter_alt</span> Áp dụng lọc
              </button>
            </div>
          </form>

          {/* ACTIVE FILTERS */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-surface-container gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-caption font-caption text-outline">Đang áp dụng:</span>
              
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary text-caption font-medium border border-primary/20">
                <span>Trạng thái: Chờ kiểm tra ngân sách</span>
                <button className="hover:text-error transition-colors flex items-center focus:outline-none cursor-default" type="button">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>

              {activeTags.map(tag => (
                <span key={tag.key} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary text-caption font-medium border border-primary/20">
                  <span>{tag.label}</span>
                  <button onClick={() => removeFilter(tag.key === 'date' ? 'startDate' : tag.key)} className="hover:text-error transition-colors flex items-center focus:outline-none" type="button">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}

              {activeTags.length > 0 && (
                <button onClick={clearAllFilters} className="text-caption font-medium text-primary hover:underline ml-1 focus:outline-none" type="button">
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant h-10">
                  <th className="px-4 py-2 text-caption font-semibold text-on-surface-variant uppercase tracking-wider">MÃ ĐỀ XUẤT</th>
                  <th className="px-4 py-2 text-caption font-semibold text-on-surface-variant uppercase tracking-wider">NGƯỜI TẠO</th>
                  <th className="px-4 py-2 text-caption font-semibold text-on-surface-variant uppercase tracking-wider">NHÓM CHUYÊN MÔN</th>
                  <th className="px-4 py-2 text-caption font-semibold text-on-surface-variant uppercase tracking-wider">SỐ LOẠI GIÁO CỤ</th>
                  <th className="px-4 py-2 text-caption font-semibold text-on-surface-variant uppercase tracking-wider text-right">TỔNG DỰ KIẾN</th>
                  <th className="px-4 py-2 text-caption font-semibold text-on-surface-variant uppercase tracking-wider">THỜI GIAN CẦN</th>
                  <th className="px-4 py-2 text-caption font-semibold text-on-surface-variant uppercase tracking-wider">MỨC ƯU TIÊN</th>
                  <th className="px-4 py-2 text-caption font-semibold text-on-surface-variant uppercase tracking-wider">NGÀY TẠO & SLA</th>
                  <th className="px-4 py-2 text-caption font-semibold text-on-surface-variant uppercase tracking-wider text-center">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {loading ? (
                   <tr>
                     <td colSpan="9" className="py-12 text-center text-on-surface-variant">
                       <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
                       <p className="mt-2">Đang tải dữ liệu...</p>
                     </td>
                   </tr>
                ) : proposals.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-3">
                          <span className="material-symbols-outlined text-[32px]">check_circle</span>
                        </div>
                        <h3 className="text-headline-sm font-semibold text-on-surface">Không có hồ sơ chờ xử lý</h3>
                        <p className="text-body-sm text-on-surface-variant max-w-md mt-1">
                          Tất cả đề xuất đã được thẩm định tài chính và chuyển Giám đốc phê duyệt chi.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  proposals.map((p) => {
                    const { date } = formatDateTime(p.createdAt);
                    return (
                      <tr key={p.id} className="hover:bg-surface-container-low transition-colors duration-150 group">
                        <td className="px-4 py-3 font-numeric-data text-body-sm font-bold text-primary tracking-tight">
                          {p.code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-body-sm font-medium text-on-surface">{p.creatorName}</span>
                            <span className="text-caption text-on-surface-variant">{p.creatorPosition}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-caption bg-surface-container-high text-on-surface font-medium border border-outline-variant">
                            {p.creatorGroupName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-body-sm text-on-surface">
                          <span className="font-medium">{p.items?.length || 0} loại</span>
                        </td>
                        <td className="px-4 py-3 text-right font-numeric-data text-body-sm font-bold text-on-surface">
                          {p.estimatedTotal?.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-4 py-3 text-body-sm text-on-surface font-numeric-data">
                          {formatDateOnly(p.requiredDate)}
                        </td>
                        <td className="px-4 py-3">
                          {getPriorityBadge(p.priority)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-body-sm text-on-surface font-numeric-data">{date}</span>
                            {renderSLABadge(p.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => navigate(`/accountant/proposal-detail/${p.id}`)}
                            className="h-8 px-3 rounded-lg border border-primary text-primary hover:bg-primary hover:text-on-primary text-caption font-semibold transition-all inline-flex items-center gap-1 shadow-sm" 
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">rule</span>
                            <span>Xem xét</span>
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
            <div className="px-5 py-3 border-t border-outline-variant bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-body-sm text-on-surface-variant">
                <span>Hiển thị <span className="font-semibold text-on-surface">{displayStart} - {displayEnd}</span> của <span className="font-semibold text-on-surface">{totalElements}</span> bản ghi</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-caption">Số dòng:</span>
                  <select value={pageSize} onChange={e => {setPageSize(Number(e.target.value)); setCurrentPage(1);}} className="h-8 px-2 text-caption bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:ring-1 focus:ring-primary outline-none">
                    <option value="10">10 / trang</option>
                    <option value="25">25 / trang</option>
                    <option value="50">50 / trang</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="w-8 h-8 rounded-lg border border-outline-variant text-outline hover:bg-surface-container-low flex items-center justify-center transition-colors disabled:opacity-40">
                  <span className="material-symbols-outlined text-[16px]">first_page</span>
                </button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg border border-outline-variant text-outline hover:bg-surface-container-low flex items-center justify-center transition-colors disabled:opacity-40">
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                
                <button className="w-8 h-8 rounded-lg bg-primary text-on-primary font-semibold text-caption flex items-center justify-center shadow-sm">
                  {currentPage}
                </button>

                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg border border-outline-variant text-outline hover:bg-surface-container-low flex items-center justify-center transition-colors disabled:opacity-40">
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg border border-outline-variant text-outline hover:bg-surface-container-low flex items-center justify-center transition-colors disabled:opacity-40">
                  <span className="material-symbols-outlined text-[16px]">last_page</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}