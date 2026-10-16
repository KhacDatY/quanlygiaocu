// src/pages/Accountant/AccountantProposalDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

// --- Helpers ---
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDateOnly = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatPeriodLabel = (label) => {
  if (!label) return '';
  // Match định dạng "Quý 4/2026" từ Backend gửi lên
  const match = label.match(/Quý\s*(\d)\s*\/?\s*(\d{4})/i);
  if (match) {
    const quarter = parseInt(match[1], 10);
    const year = match[2];
    
    // ĐÂY LÀ CHỖ THÊM CÁC THÁNG CỤ THỂ CHO TỪNG QUÝ
    switch (quarter) {
      case 1: return `Quý 1/${year} (Tháng 01 - Tháng 03/${year})`;
      case 2: return `Quý 2/${year} (Tháng 04 - Tháng 06/${year})`;
      case 3: return `Quý 3/${year} (Tháng 07 - Tháng 09/${year})`;
      case 4: return `Quý 4/${year} (Tháng 10 - Tháng 12/${year})`;
      default: return label;
    }
  }
  return label; 
};

const mapCategory = (categoryEnum) => {
  const categoryMap = { 'PEN': 'Bút', 'PAPER': 'Giấy', 'FLASHCARD': 'Thẻ từ vựng', 'BOOK': 'Sách', 'AUDIO_DEVICE': 'Thiết bị âm thanh', 'OTHER': 'Khác' };
  return categoryMap[categoryEnum] || categoryEnum;
};

const getFileIconInfo = (fileName) => {
  if (!fileName) return { icon: 'description', text: 'DOC', bg: 'bg-surface-container', color: 'text-primary' };
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf') return { icon: 'picture_as_pdf', text: 'PDF', bg: 'bg-red-100', color: 'text-red-700' };
  if (['xls', 'xlsx'].includes(ext)) return { icon: 'description', text: 'XLS', bg: 'bg-green-100', color: 'text-green-700' };
  return { icon: 'description', text: ext.toUpperCase(), bg: 'bg-surface-container', color: 'text-primary' };
};

const getAvatarInitials = (fullName) => {
  if (!fullName) return 'GV';
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// --- Component Toast (Thông báo giống image_ba7520.png) ---
const ToastNotification = ({ show, config, onClose }) => {
  if (!show || !config) return null;
  return (
    <div className="fixed top-20 right-6 z-[80] flex flex-col gap-3 w-full max-w-[420px] animate-fade-in-up">
      <div className={`pointer-events-auto bg-white border ${config.borderColor} rounded-xl p-4 shadow-xl relative overflow-hidden flex items-start gap-3`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg} ${config.iconColor}`}>
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{config.icon}</span>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-base font-bold ${config.titleColor}`}>{config.title}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${config.badgeBg} ${config.badgeColor}`}>Vừa xong</span>
          </div>
          <p className="text-[13px] text-slate-600 leading-snug" dangerouslySetInnerHTML={{ __html: config.message }}></p>
        </div>
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1" type="button">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
};

export default function AccountantProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [modalType, setModalType] = useState(null); 
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [toastConfig, setToastConfig] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [proposalData, budgetData] = await Promise.all([
          apiClient.get(`/proposals/${id}`),
          apiClient.get(`/proposals/${id}/budget-check`)
        ]);
        
        setProposal(proposalData);
        setBudgetInfo(budgetData);

      } catch (error) {
        alert(error.response?.data?.message || error.message || 'Lỗi kết nối khi lấy dữ liệu đề xuất và ngân sách.');
        navigate('/accountant/pending-budget');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, navigate]);

  const closeModal = () => {
    setModalType(null);
    setNote('');
    setNoteError('');
  };

  const handleActionSubmit = async () => {
    if (modalType === 'reject' && !note.trim()) {
      setNoteError('Vui lòng nhập lý do từ chối.');
      return;
    }

    setActionLoading(true);
    try {
      let endpoint = modalType === 'approve' ? 'approve-accountant' : 'reject-accountant';
      await apiClient.post(`/proposals/${id}/${endpoint}`, { note: note.trim() });
      
      const currentType = modalType;
      closeModal();
      
      // Toast Giống y hệt image_ba7520.png
      setToastConfig({
        borderColor: currentType === 'approve' ? 'border-emerald-200' : 'border-rose-200',
        iconBg: currentType === 'approve' ? 'bg-emerald-100' : 'bg-rose-100',
        iconColor: currentType === 'approve' ? 'text-emerald-600' : 'text-rose-600',
        titleColor: currentType === 'approve' ? 'text-emerald-900' : 'text-rose-900',
        badgeBg: currentType === 'approve' ? 'bg-emerald-100' : 'bg-rose-100',
        badgeColor: currentType === 'approve' ? 'text-emerald-700' : 'text-rose-700',
        icon: currentType === 'approve' ? 'check_circle' : 'cancel',
        title: currentType === 'approve' ? 'Xử lý thành công' : 'Đã từ chối đề xuất',
        message: currentType === 'approve' 
          ? `Đã xác nhận đề xuất <strong class="text-primary font-mono">${proposal.code}</strong>. Đề xuất đã chuyển sang trạng thái <strong class="text-emerald-700">Chờ duyệt chi</strong>.`
          : `Đã từ chối đề xuất <strong class="text-primary font-mono">${proposal.code}</strong>. Trưởng nhóm chuyên môn đã nhận được thông báo kèm lý do từ chối.`
      });

      setTimeout(() => {
        setToastConfig(null);
        navigate('/accountant/pending-budget');
      }, 3500);

    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xử lý đề xuất');
    } finally {
      setActionLoading(false);
    }
  };

  const getManagerApprovalDate = () => {
    if (!proposal || !proposal.histories) return proposal?.createdAt;
    const approvalHistory = proposal.histories.find(h => h.actionLabel.toLowerCase().includes('duyệt'));
    return approvalHistory ? approvalHistory.createdAt : proposal.createdAt;
  };

  const renderSLABadge = () => {
    const approvalDate = new Date(getManagerApprovalDate());
    const now = new Date();
    const diffMs = now - approvalDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (diffDays > 2) {
      const overdueDays = Math.floor(diffDays - 2);
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-caption font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="material-symbols-outlined text-xs text-amber-600">warning</span>
          Quá hạn SLA (+{overdueDays} ngày)
        </span>
      );
    }
    return null;
  };

  if (loading || !proposal || !budgetInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface text-primary">
        <span className="material-symbols-outlined animate-spin text-5xl mb-2">sync</span>
        <p className="font-medium">Đang đồng bộ dữ liệu ngân sách...</p>
      </div>
    );
  }

  // Dữ liệu ngân sách & giáo cụ
  const isBudgetSufficient = budgetInfo.budgetSufficient !== undefined ? budgetInfo.budgetSufficient : budgetInfo.isBudgetSufficient;
  const isOverBudget = !isBudgetSufficient;
  const allocated = budgetInfo.allocatedAmount || 0;
  const spent = budgetInfo.spentAmount || 0;
  const committed = budgetInfo.committedAmount || 0;
  const availableBefore = budgetInfo.availableBeforeApproval || 0;
  const proposalTotal = budgetInfo.proposalEstimatedTotal || 0;
  const availableAfter = budgetInfo.remainingIfApproved || 0;

  const baseAllocated = allocated > 0 ? allocated : 1; 
  const pctSpent = (spent / baseAllocated) * 100;
  const pctCommitted = (committed / baseAllocated) * 100;
  const pctProposal = (proposalTotal / baseAllocated) * 100;
  const pctTotalUsed = pctSpent + pctCommitted + pctProposal;
  const pctAvailable = Math.max(0, 100 - pctTotalUsed);

  const totalItemsQuantity = proposal.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

  return (
    <div className="relative min-h-screen bg-background pb-28">
      <ToastNotification show={!!toastConfig} config={toastConfig} onClose={() => setToastConfig(null)} />

      <main className="p-6 max-w-[1600px] w-full mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <nav className="flex items-center gap-2 text-label-sm text-on-surface-variant">
            <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/accountant/pending-budget')}>Phê duyệt ngân sách</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-on-surface font-semibold">{isOverBudget ? `Chi tiết đề xuất - Cảnh báo vượt ngân sách ${proposal.code}` : `Chi tiết đề xuất ${proposal.code}`}</span>
          </nav>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors font-label-md">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại danh sách
          </button>
        </div>

        {/* Header Banner */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-headline-lg font-mono font-bold text-on-surface tracking-tight">{proposal.code}</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span> Chờ kiểm tra ngân sách
              </span>
              {renderSLABadge()}
              {isOverBudget && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold bg-red-100 text-red-700 border border-red-200">
                  <span className="material-symbols-outlined text-xs text-red-600">error</span>Vượt ngân sách ({formatCurrency(Math.abs(availableAfter))})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant mt-1">
              <span>Ngày Quản lý duyệt: <strong>{formatDateOnly(getManagerApprovalDate())}</strong></span>
              <span>•</span>
              <span>Cơ sở: <strong>Hà Nội - Cầu Giấy</strong></span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-label-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 shadow-xs self-start md:self-auto">
            <span className="material-symbols-outlined text-base">account_balance</span>
            Cấp xử lý hiện tại: <strong>Kế toán thẩm định</strong>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 flex flex-col gap-6">
            
            {/* THÔNG TIN PHIẾU ĐỀ XUẤT */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">description</span>
                  <h2 className="text-headline-sm text-on-surface">Thông tin phiếu đề xuất</h2>
                </div>
                <span className="text-caption text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">Chế độ xem chỉ đọc</span>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-5">
                <div><span className="text-label-sm text-on-surface-variant block mb-1">Mã đề xuất:</span><span className="text-body-md font-mono font-semibold text-primary">{proposal.code}</span></div>
                <div>
                  <span className="text-label-sm text-on-surface-variant block mb-1">Người tạo:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{getAvatarInitials(proposal.creatorName)}</div>
                    <span className="text-body-md font-medium text-on-surface">{proposal.creatorName} <span className="text-caption text-on-surface-variant">({proposal.creatorPosition})</span></span>
                  </div>
                </div>
                <div>
                  <span className="text-label-sm text-on-surface-variant block mb-1">Nhóm chuyên môn:</span>
                  <span className="inline-flex px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-caption font-medium border border-blue-100">{proposal.creatorGroupName || budgetInfo.groupName}</span>
                </div>
                <div><span className="text-label-sm text-on-surface-variant block mb-1">Thời gian cần hàng:</span><span className="text-body-md font-medium text-on-surface">{formatDateOnly(proposal.requiredDate)}</span></div>
                
                <div>
                  <span className="text-label-sm text-on-surface-variant block mb-1">Mức độ ưu tiên:</span>
                  {proposal.priority === 'HIGH' ? (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded text-caption font-semibold">
                      <span className="material-symbols-outlined text-[14px]">priority_high</span> Cao
                    </span>
                  ) : proposal.priority === 'MEDIUM' ? (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded text-caption font-semibold">
                      <span className="material-symbols-outlined text-[14px]">schedule</span> Trung bình
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded text-caption font-semibold">
                      <span className="material-symbols-outlined text-[14px]">low_priority</span> Thấp
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-label-sm text-on-surface-variant block mb-1">Ngày gửi đề xuất:</span>
                  <span className="text-body-md text-on-surface">{formatDateOnly(proposal.createdAt)}</span>
                </div>

                <div className="col-span-2 pt-2 border-t border-outline-variant/60">
                  <span className="text-label-sm text-on-surface-variant block mb-1">Mục đích sử dụng:</span>
                  <p className="text-body-sm text-on-surface leading-relaxed bg-surface-bright p-3 rounded-lg border border-outline-variant/80">{proposal.purpose}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-col">
                  <span className="font-label-md text-blue-900">Tổng chi phí dự kiến đề xuất:</span>
                  <span className="text-caption text-blue-700">Kế toán dùng số liệu này để đối soát hạn mức phê duyệt</span>
                </div>
                <div className="text-right">
                  <div className="text-headline-lg font-mono font-bold text-primary">{formatCurrency(proposalTotal)}</div>
                </div>
              </div>
            </div>

            {/* KIỂM TRA NGÂN SÁCH DYNAMIC */}
            <div className={`bg-surface-container-lowest border ${isOverBudget ? 'border-red-200' : 'border-outline-variant'} rounded-xl p-6 shadow-sm`}>
              <div className={`flex flex-wrap items-center justify-between gap-3 pb-4 border-b ${isOverBudget ? 'border-red-200' : 'border-outline-variant'} mb-5`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isOverBudget ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                    <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-headline-sm font-semibold text-on-surface">Thông tin ngân sách đối soát</h2>
                      {isOverBudget && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">Cảnh báo thiếu hụt</span>}
                    </div>
                    <p className="text-caption text-on-surface-variant">Dữ liệu định mức và hạn mức chi tiêu trực tiếp từ hệ thống tài chính</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-caption text-on-surface-variant bg-surface-container px-2.5 py-1 rounded font-medium">Chế độ xem tự động</span>
                  {isOverBudget ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-bold bg-red-100 text-red-700 border border-red-200">
                      <span className="material-symbols-outlined text-base">error</span>Vượt ngân sách
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-bold bg-green-100 text-green-700 border border-green-200">
                      <span className="material-symbols-outlined text-base">check_circle</span>Đủ ngân sách
                    </span>
                  )}
                </div>
              </div>

              {isOverBudget && (
                <div className="mb-5 p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3 shadow-xs">
                  <span className="material-symbols-outlined text-red-600 text-2xl flex-shrink-0 mt-0.5">warning</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-label-md text-red-700 font-bold uppercase tracking-tight">CẢNH BÁO VƯỢT HẠN MỨC NGÂN SÁCH KHẢ DỤNG</h3>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-bold bg-white text-red-700 border border-red-300">
                        Số tiền vượt: {formatCurrency(Math.abs(availableAfter))}
                      </span>
                    </div>
                    <p className="text-body-sm text-red-700 mt-1 leading-relaxed">Đề xuất này vượt <strong>{formatCurrency(Math.abs(availableAfter))}</strong> so với ngân sách khả dụng còn lại của {formatPeriodLabel(budgetInfo.periodLabel)}. Kế toán không thể xác nhận chuyển duyệt chi cho đến khi điều chỉnh số lượng giáo cụ hoặc bổ sung nguồn hạn mức.</p>
                  </div>
                </div>
              )}

              <div className="mb-5 p-3.5 rounded-lg bg-surface-bright border border-outline-variant/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-body-sm">
                  <span className="text-on-surface-variant font-medium">Kỳ ngân sách:</span><span className="font-semibold text-on-surface">{formatPeriodLabel(budgetInfo.periodLabel)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="p-3.5 rounded-xl border border-outline-variant/80 bg-surface-container-low flex flex-col justify-between">
                  <span className="text-label-sm text-on-surface-variant mb-1">Ngân sách được cấp:</span>
                  <span className="text-headline-sm font-mono font-bold text-on-surface">{formatCurrency(allocated)}</span>
                  <span className="text-[11px] text-on-surface-variant mt-1">Định mức phê duyệt đầu kỳ</span>
                </div>
                <div className="p-3.5 rounded-xl border border-outline-variant/80 bg-surface-container-low flex flex-col justify-between">
                  <span className="text-label-sm text-on-surface-variant mb-1">Đã thực chi:</span>
                  <span className="text-headline-sm font-mono font-bold text-on-surface">{formatCurrency(spent)}</span>
                  <span className="text-[11px] text-on-surface-variant mt-1">Chiếm {pctSpent.toFixed(1)}% hạn mức cấp</span>
                </div>
                <div className="p-3.5 rounded-xl border border-outline-variant/80 bg-surface-container-low flex flex-col justify-between">
                  <span className="text-label-sm text-on-surface-variant mb-1">Đã cam kết (PO chờ chi):</span>
                  <span className="text-headline-sm font-mono font-bold text-amber-700">{formatCurrency(committed)}</span>
                  <span className="text-[11px] text-on-surface-variant mt-1">({pctCommitted.toFixed(1)}%)</span>
                </div>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl mb-5 ${isOverBudget ? 'bg-red-50 border border-red-200' : 'bg-blue-50/70 border border-blue-200'}`}>
                <div className="flex flex-col">
                  <span className={`text-label-sm mb-0.5 ${isOverBudget ? 'text-on-surface-variant' : 'text-blue-900'}`}>Ngân sách khả dụng trước duyệt:</span>
                  <span className={`text-body-md font-mono font-bold ${isOverBudget ? 'text-on-surface' : 'text-primary'}`}>{formatCurrency(availableBefore)}</span>
                </div>
                <div className={`flex flex-col border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 ${isOverBudget ? 'border-red-200' : 'border-blue-200'}`}>
                  <span className="text-label-sm text-blue-900 mb-0.5">Tổng chi phí đề xuất này:</span>
                  <span className="text-body-md font-mono font-bold text-primary">{formatCurrency(proposalTotal)}</span>
                </div>
                <div className={`flex flex-col border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 ${isOverBudget ? 'border-red-200' : 'border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-label-sm mb-0.5 font-semibold ${isOverBudget ? 'text-red-700' : 'text-blue-900'}`}>Ngân sách còn lại nếu duyệt:</span>
                    {isOverBudget && <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[10px] font-bold rounded">ÂM</span>}
                  </div>
                  <span className={`text-body-md font-mono font-bold ${isOverBudget ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(Math.abs(availableAfter))}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-caption mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`${isOverBudget ? 'text-red-700' : 'text-on-surface-variant'} font-semibold`}>Tỷ lệ sử dụng sau khi duyệt {isOverBudget ? '(Quá tải):' : ':'}</span>
                    {isOverBudget && <span className="material-symbols-outlined text-xs text-red-600">error</span>}
                  </div>
                  <span className={`font-mono font-bold ${isOverBudget ? 'text-red-700' : 'text-primary'}`}>{pctTotalUsed.toFixed(1)}%</span>
                </div>
                <div className={`w-full h-2.5 rounded-full overflow-hidden flex border ${isOverBudget ? 'border-red-200' : 'bg-surface-container border-outline-variant/60'}`}>
                  <div className="h-full bg-primary" style={{ width: `${Math.min(pctSpent, 100)}%` }}></div>
                  <div className="h-full bg-amber-600" style={{ width: `${Math.min(pctCommitted, 100 - pctSpent)}%` }}></div>
                  <div className={`h-full ${isOverBudget ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`} style={{ width: `${Math.min(pctProposal, 100 - pctSpent - pctCommitted)}%` }}></div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-on-surface-variant mt-2 font-medium">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-primary"></span><span>Đã chi: {pctSpent.toFixed(1)}%</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-600"></span><span>Đã cam kết: {pctCommitted.toFixed(1)}%</span></div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded ${isOverBudget ? 'bg-red-600' : 'bg-emerald-600'}`}></span>
                    <span className={isOverBudget ? 'text-red-700 font-bold' : ''}>Đề xuất này: {pctProposal.toFixed(1)}% {isOverBudget && '(Vượt HM)'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-surface-container border border-outline-variant"></span>
                    <span>{isOverBudget ? `Khả dụng hiện có: ${formatCurrency(availableBefore)}` : `Còn khả dụng: ${pctAvailable.toFixed(1)}% (${formatCurrency(availableAfter)})`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BẢNG CHI TIẾT GIÁO CỤ */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 pb-3 border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">table_chart</span>
                  <h2 className="text-headline-sm text-on-surface">Bảng chi tiết giáo cụ</h2>
                </div>
                <span className="text-label-sm text-on-surface-variant">Tổng số: {proposal.items?.length || 0} danh mục</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-bright border-b border-outline-variant text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      <th className="py-3 px-4">Loại giáo cụ & quy cách</th>
                      <th className="py-3 px-3 text-center">Số lượng</th>
                      <th className="py-3 px-3 text-center">ĐVT</th>
                      <th className="py-3 px-4 text-right">Đơn giá dự kiến</th>
                      <th className="py-3 px-4 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60 text-body-sm">
                    {proposal.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-bright/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-on-surface">{item.name}</div>
                          <div className="text-caption text-on-surface-variant">{mapCategory(item.category)}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                        <td className="py-3 px-3 text-center text-on-surface-variant">{item.unit}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.price)}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-container-low border-t border-outline-variant">
                      <td className="py-3 px-4 text-right font-semibold" colSpan="4">Tổng tiền hàng dự kiến:</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-headline-sm text-primary">{formatCurrency(proposalTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* TÀI LIỆU ĐÍNH KÈM */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">attach_file</span>
                  <h2 className="text-headline-sm text-on-surface">File đính kèm & Báo giá tham khảo</h2>
                </div>
                <span className="text-caption text-on-surface-variant">{proposal.attachments?.length || 0} tài liệu đính kèm</span>
              </div>
              <div className="flex flex-col gap-3">
                {proposal.attachments && proposal.attachments.length > 0 ? (
                  proposal.attachments.map((file, idx) => {
                    const iconInfo = getFileIconInfo(file.fileName);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-outline-variant bg-surface-bright hover:border-primary/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${iconInfo.bg} ${iconInfo.color} flex items-center justify-center`}>
                            <span className="material-symbols-outlined text-xl">{iconInfo.icon}</span>
                          </div>
                          <div>
                            <span className="text-label-md font-medium text-on-surface block">{file.fileName}</span>
                            <span className="text-caption text-on-surface-variant">Tài liệu tham khảo</span>
                          </div>
                        </div>
                        {file.fileUrl && (
                          <div className="flex items-center gap-2">
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                              <span className="material-symbols-outlined text-sm">download</span> Tải về
                            </a>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center p-4 border border-dashed rounded-lg text-on-surface-variant text-body-sm">
                    Không có tài liệu đính kèm.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* FOOTER ACTION BAR CỐ ĐỊNH */}
      <div className="fixed bottom-0 left-[260px] right-0 z-30 bg-surface-container-lowest border-t border-outline-variant shadow-lg px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-label-sm text-on-surface-variant">Mã đề xuất:</span>
            <span className="font-mono font-bold text-on-surface text-label-md">{proposal.code}</span>
          </div>
          <div className="h-5 w-px bg-outline-variant"></div>
          <div className="flex items-baseline gap-2">
            <span className="text-label-sm text-on-surface-variant">Tổng chi phí dự kiến:</span>
            <span className="text-headline-md font-bold font-mono text-primary">{formatCurrency(proposalTotal)}</span>
          </div>
          <div className="h-5 w-px bg-outline-variant"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-label-sm text-on-surface-variant">Đối chiếu:</span>
            {isOverBudget ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                <span className="material-symbols-outlined text-sm text-red-600">error</span>Vượt ngân sách
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-caption font-bold bg-green-100 text-green-700 border border-green-200">
                <span className="material-symbols-outlined text-sm text-green-600">check_circle</span>Đủ ngân sách
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isOverBudget && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-inverse-surface text-white text-xs font-medium shadow-md">
              <span className="material-symbols-outlined text-amber-600 text-base">lock</span>
              <span>Không thể duyệt vì đề xuất vượt ngân sách khả dụng</span>
              <span className="material-symbols-outlined text-sm text-outline-variant">arrow_forward</span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setModalType('reject')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500 text-red-600 bg-white hover:bg-red-50 font-label-md transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-lg">close</span> Từ chối
            </button>
            <button 
              onClick={() => { if (!isOverBudget) setModalType('approve'); }}
              disabled={isOverBudget}
              title={isOverBudget ? "Không thể duyệt vì đề xuất vượt ngân sách khả dụng" : "Xác nhận đủ ngân sách"}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-label-md font-semibold transition-all shadow-sm ${isOverBudget ? 'bg-surface-container border border-outline-variant text-outline opacity-60 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
            >
              <span className="material-symbols-outlined text-lg">check_circle</span> Đồng ý
            </button>
          </div>
        </div>
      </div>

      {/* MODALS GIỐNG HỆT THIẾT KẾ image_ba74e3 VÀ image_ba7500 */}
      {modalType && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col ${modalType === 'approve' ? 'max-w-[460px]' : 'max-w-[480px]'}`}>
            
            {/* Modal Header & Icon */}
            <div className="px-6 pt-6 pb-2 flex items-start justify-between">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${modalType === 'approve' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {modalType === 'approve' ? 'check_circle' : 'cancel'}
                </span>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 pb-6">
              <h2 className="text-[20px] font-bold text-slate-900 mb-1">
                {modalType === 'approve' ? 'Xác nhận chuyển duyệt chi' : 'Từ chối đề xuất'}
              </h2>
              <p className="text-[13px] text-slate-500 mb-4">
                {modalType === 'approve' ? 'Xác nhận đề xuất và chuyển Giám đốc Trung tâm duyệt chi' : 'Từ chối đề xuất ở bước kiểm tra ngân sách'}
              </p>

              {modalType === 'approve' && (
                <>
                  <p className="text-[13.5px] text-slate-700 mb-4 leading-relaxed">
                    Bạn có chắc chắn muốn xác nhận đề xuất <strong className="text-primary font-mono">{proposal.code}</strong> và chuyển sang bước duyệt chi?
                  </p>

                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-5">
                    <div className="p-3.5 space-y-3">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Mã đề xuất:</span>
                        <span className="font-mono font-semibold text-primary">{proposal.code}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Tổng chi phí:</span>
                        <span className="font-mono font-semibold text-primary">{formatCurrency(proposalTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Ngân sách khả dụng:</span>
                        <span className="font-mono font-semibold text-emerald-600">{formatCurrency(availableBefore)}</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 px-3.5 py-3 flex justify-between items-center border-t border-emerald-100">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-emerald-900">Ngân sách còn lại sau khi duyệt:</span>
                        <span className="text-[11px] text-emerald-700">(Đảm bảo số dư an toàn)</span>
                      </div>
                      <span className="font-mono font-bold text-[15px] text-emerald-700">{formatCurrency(availableAfter)}</span>
                    </div>
                  </div>

                  <div className="bg-[#f0f7ff] border border-[#d6e8ff] rounded-xl p-3.5 flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#2563eb] text-[18px] shrink-0 mt-0.5">info</span>
                    <p className="text-[13px] text-[#1e3a8a] leading-relaxed">
                      Sau khi xác nhận, đề xuất sẽ chuyển sang trạng thái <strong className="font-semibold">Chờ duyệt chi</strong>. Giám đốc Trung tâm sẽ nhận được thông báo để phê duyệt chi tiêu.
                    </p>
                  </div>
                </>
              )}

              {modalType === 'reject' && (
                <>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-5">
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Mã đề xuất:</span>
                        <span className="font-mono font-semibold text-primary">{proposal.code}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Số loại giáo cụ:</span>
                        <span className="font-medium text-slate-800">{proposal.items?.length || 0} danh mục ({totalItemsQuantity} sản phẩm)</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Người tạo:</span>
                        <span className="font-medium text-slate-800">{proposal.creatorName} ({proposal.creatorGroupName || 'Khối Mầm non'})</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px] pt-3 border-t border-slate-200">
                        <span className="text-slate-500">Tổng chi phí dự kiến:</span>
                        <span className="font-mono font-bold text-[15px] text-slate-900">{formatCurrency(proposalTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-5">
                    <label className="text-[13px] font-bold text-slate-800">Lý do từ chối <span className="text-rose-500">*</span></label>
                    <textarea 
                      value={note} onChange={(e) => { setNote(e.target.value); setNoteError(''); }}
                      className={`w-full rounded-lg p-3 text-[13px] resize-none outline-none ${noteError ? 'border border-rose-500 bg-rose-50/30 text-rose-900 placeholder-rose-300' : 'border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary'}`}
                      placeholder="Nhập lý do từ chối đề xuất..." rows="3"
                    ></textarea>
                    {noteError && <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-[14px]">error</span>{noteError}</span>}
                  </div>

                  <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3.5 flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#d97706] text-[18px] shrink-0 mt-0.5">warning</span>
                    <p className="text-[13px] text-[#92400e] leading-relaxed">
                      Sau khi xác nhận từ chối, đề xuất sẽ chuyển sang trạng thái <strong className="font-semibold">Từ chối</strong>. Trưởng nhóm chuyên môn sẽ nhận được thông báo kèm lý do này.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium text-[13px] transition-colors">
                Hủy
              </button>
              <button 
                onClick={handleActionSubmit} disabled={actionLoading}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-white font-semibold text-[13px] transition-colors ${actionLoading ? 'opacity-70 cursor-wait' : ''} ${modalType === 'approve' ? 'bg-[#059669] hover:bg-[#047857]' : 'bg-[#dc2626] hover:bg-[#b91c1c]'}`}
              >
                {modalType === 'approve' ? (
                  <>
                    <span className={`material-symbols-outlined text-[18px] ${actionLoading ? 'animate-spin' : ''}`}>{actionLoading ? 'sync' : 'check'}</span>
                    {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                  </>
                ) : (
                  <>
                    <span className={`material-symbols-outlined text-[18px] ${actionLoading ? 'animate-spin' : ''}`}>{actionLoading ? 'sync' : 'cancel'}</span>
                    {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}