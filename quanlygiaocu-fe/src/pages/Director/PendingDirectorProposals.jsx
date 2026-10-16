// src/pages/Director/PendingDirectorProposals.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function PendingDirectorProposals() {
  const navigate = useNavigate();
  
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Bộ lọc
  const [filterInput, setFilterInput] = useState({
    startDate: '', endDate: '', priority: '', groupId: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: '', endDate: '', priority: '', groupId: ''
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const groupsRes = await apiClient.get('/groups');
        setGroups(groupsRes || []);
      } catch (error) {
        console.error('Lỗi tải nhóm:', error);
      }
    };
    fetchOptions();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage - 1, 
        size: pageSize,
        sort: 'createdAt,asc' 
      };
      
      if (appliedFilters.priority) params.priority = appliedFilters.priority;
      if (appliedFilters.groupId) params.groupId = appliedFilters.groupId;
      if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
      if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;

      // Endpoint mẫu cho Giám đốc (bạn hãy đổi lại nếu BE dùng URL khác)
      const response = await apiClient.get('/proposals/pending-director', { params });
      
      setProposals(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Lỗi tải danh sách chờ Giám đốc duyệt:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [currentPage, pageSize, appliedFilters]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setAppliedFilters({ ...filterInput });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    const empty = { startDate: '', endDate: '', priority: '', groupId: '' };
    setFilterInput(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' ₫';
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">Cao</span>;
      case 'MEDIUM': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Trung bình</span>;
      case 'LOW': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Thấp</span>;
      default: return null;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-background">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6 pb-20">
        
        {/* Header */}
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span>Trang chủ</span> <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-semibold">Danh sách đề xuất chờ duyệt chi</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách đề xuất chờ duyệt chi</h1>
          <p className="text-sm text-slate-500 mt-1">Các đề xuất đã được Kế toán xác nhận nguồn ngân sách, đang chờ Giám đốc Trung tâm phê duyệt chi.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
            <span className="text-sm font-medium text-slate-500 uppercase">Cần xử lý</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold text-primary">{totalElements}</span>
              <span className="text-sm text-slate-500">đề xuất</span>
            </div>
            <span className="text-xs text-primary font-medium mt-3 bg-blue-50 w-max px-2 py-1 rounded">Đang chờ Giám đốc phê duyệt</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <form onSubmit={handleApplyFilter} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
              <label className="text-xs font-semibold text-slate-600 uppercase">Ngày kế toán xác nhận</label>
              <div className="flex items-center gap-2">
                <input type="date" value={filterInput.startDate} onChange={e => setFilterInput({...filterInput, startDate: e.target.value})} className="w-full text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary" />
                <span className="text-slate-400">đến</span>
                <input type="date" value={filterInput.endDate} onChange={e => setFilterInput({...filterInput, endDate: e.target.value})} className="w-full text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Mức ưu tiên</label>
              <select value={filterInput.priority} onChange={e => setFilterInput({...filterInput, priority: e.target.value})} className="w-full text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary">
                <option value="">Tất cả mức độ</option>
                <option value="HIGH">Cao</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="LOW">Thấp</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Khối chuyên môn</label>
              <select value={filterInput.groupId} onChange={e => setFilterInput({...filterInput, groupId: e.target.value})} className="w-full text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary">
                <option value="">Tất cả khối bộ môn</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearAllFilters} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">refresh</span> Làm mới</button>
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-800 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">filter_alt</span> Áp dụng lọc</button>
            </div>
          </form>
        </div>

        {/* Bảng Dữ Liệu */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">MÃ ĐỀ XUẤT</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">NGƯỜI TẠO</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">NGÀY TẠO</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">TÊN GIÁO CỤ</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">SỐ LƯỢNG</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">CHI PHÍ DỰ KIẾN</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">MỨC ĐỘ ƯU TIÊN</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="8" className="py-10 text-center"><span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span></td></tr>
                ) : proposals.length === 0 ? (
                  <tr><td colSpan="8" className="py-10 text-center text-slate-500">Không có đề xuất nào chờ duyệt chi.</td></tr>
                ) : (
                  proposals.map(p => {
                    const firstItemName = p.items && p.items.length > 0 ? p.items[0].name : 'Giáo cụ khác';
                    const totalQty = p.items?.reduce((acc, i) => acc + (i.quantity || 0), 0) || 0;
                    
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-mono font-bold text-primary">{p.code}</td>
                        <td className="px-4 py-4 font-medium text-slate-900">{p.creatorName}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatDateOnly(p.createdAt)}</td>
                        <td className="px-4 py-4 text-sm text-slate-700 max-w-[200px] truncate" title={firstItemName}>{firstItemName} {p.items?.length > 1 && `(+${p.items.length - 1})`}</td>
                        <td className="px-4 py-4 text-sm font-mono text-slate-700 text-center">{totalQty}</td>
                        <td className="px-4 py-4 text-sm font-mono font-bold text-slate-900 text-right">{formatCurrency(p.estimatedTotal)}</td>
                        <td className="px-4 py-4 text-center">{getPriorityBadge(p.priority)}</td>
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => navigate(`/director/proposal-detail/${p.id}`)} className="px-4 py-1.5 border border-primary text-primary rounded-lg text-xs font-semibold hover:bg-primary hover:text-white transition-colors">
                            Xem xét
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}