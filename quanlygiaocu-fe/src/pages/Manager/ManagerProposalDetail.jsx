// src/pages/Manager/ManagerProposalDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { AuthContext } from '../../contexts/AuthContext';

// --- Helper Functions ---
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

const getDaysRemaining = (dateString) => {
  if (!dateString) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getPriceRange = (items) => {
  if (!items || items.length === 0) return '0 ₫';
  const prices = items.map(item => item.price || 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return `${formatCurrency(min)} / sản phẩm`;
  return `Từ ${formatCurrency(min)} - ${formatCurrency(max)} / sản phẩm`;
};

const getFileIconInfo = (fileName) => {
  if (!fileName) return { text: 'FILE', bg: 'bg-surface-container', color: 'text-primary' };
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf') return { text: 'PDF', bg: 'bg-tertiary-fixed', color: 'text-tertiary' };
  if (['png', 'jpg', 'jpeg'].includes(ext)) return { text: 'IMG', bg: 'bg-surface-container', color: 'text-primary' };
  if (['xls', 'xlsx'].includes(ext)) return { text: 'XLS', bg: 'bg-secondary-container', color: 'text-secondary' };
  if (['doc', 'docx'].includes(ext)) return { text: 'DOC', bg: 'bg-primary-container', color: 'text-on-primary-container' };
  return { text: ext.toUpperCase(), bg: 'bg-surface-container', color: 'text-primary' };
};

const mapStatus = (statusEnum) => {
  const statusMap = {
    'PENDING_MANAGER': 'Chờ duyệt đề xuất',
    'PENDING_ACCOUNTANT': 'Chờ KT duyệt ngân sách',
    'PENDING_DIRECTOR': 'Chờ GĐ duyệt chi',
    'APPROVED': 'Đã phê duyệt',
    'REJECTED': 'Đã từ chối',
    'NEEDS_REVISION': 'Yêu cầu chỉnh sửa'
  };
  return statusMap[statusEnum] || statusEnum;
};

const mapPriority = (priorityEnum) => {
  const priorityMap = {
    'HIGH': 'Ưu tiên cao',
    'MEDIUM': 'Trung bình',
    'LOW': 'Thấp',
    'URGENT': 'Khẩn cấp'
  };
  return priorityMap[priorityEnum] || priorityEnum;
};

const mapCategory = (categoryEnum) => {
  const categoryMap = {
    'PEN': 'Bút',
    'PAPER': 'Giấy',
    'FLASHCARD': 'Thẻ từ vựng',
    'BOOK': 'Sách',
    'AUDIO_DEVICE': 'Thiết bị âm thanh',
    'OTHER': 'Khác'
  };
  return categoryMap[categoryEnum] || categoryEnum;
};

// --- Component Toast (Thông báo) ---
const ToastNotification = ({ show, config, onClose }) => {
  if (!show || !config) return null;
  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 w-full max-w-md">
      <style>{`
        @keyframes progress-countdown { from { width: 100%; } to { width: 0%; } }
        .animate-progress { animation: progress-countdown 4s linear forwards; }
      `}</style>
      
      <div className={`pointer-events-auto bg-surface-container-lowest border-2 ${config.borderColor} rounded-xl p-4 shadow-xl transition-all duration-300 relative overflow-hidden`}>
        {/* Progress bar tự đóng */}
        <div className={`absolute top-0 left-0 h-1 ${config.progressBg} animate-progress`}></div>
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full ${config.iconBg} ${config.iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
              <span className="material-symbols-outlined text-[20px] fill" style={{ fontVariationSettings: "'FILL' 1" }}>{config.icon}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-label-md text-label-md text-on-surface font-bold">{config.title}</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder}`}>
                  {config.badge}
                </span>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-snug" dangerouslySetInnerHTML={{ __html: config.message }}></p>
            </div>
          </div>
          <button onClick={onClose} className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors shrink-0" type="button" title="Đóng">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ManagerProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalType, setModalType] = useState(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [toastConfig, setToastConfig] = useState(null);

  useEffect(() => {
    const fetchProposalDetail = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(`/proposals/${id}`);
        setProposal(data);
      } catch (err) {
        setError(err.message || 'Không thể tải chi tiết đề xuất');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProposalDetail();
  }, [id]);

  const closeModal = () => {
    setModalType(null);
    setNote('');
    setNoteError('');
  };

  const showToastAndNavigate = (type, proposalCode, creatorName) => {
    let config = null;
    if (type === 'approve') {
      config = {
        borderColor: 'border-emerald-500', progressBg: 'bg-emerald-500',
        iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700', icon: 'check_circle',
        title: 'Xử lý thành công', badge: 'Đã phê duyệt', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800', badgeBorder: 'border-emerald-200',
        message: `Đã đồng ý đề xuất <strong class="text-primary font-mono font-bold">${proposalCode}</strong>. Hệ thống đã chuyển sang bước <strong>Kiểm tra ngân sách cơ sở</strong>.`
      };
    } else if (type === 'reject') {
      config = {
        borderColor: 'border-rose-500', progressBg: 'bg-rose-500',
        iconBg: 'bg-rose-100', iconColor: 'text-rose-700', icon: 'cancel',
        title: 'Đã từ chối đề xuất', badge: 'Đã đóng hồ sơ', badgeBg: 'bg-rose-100', badgeText: 'text-rose-800', badgeBorder: 'border-rose-200',
        message: `Đã từ chối đề xuất <strong class="text-primary font-mono">${proposalCode}</strong>. Lý do từ chối đã được gửi thông báo đến <strong>${creatorName}</strong>.`
      };
    } else if (type === 'revise') {
      config = {
        borderColor: 'border-amber-500', progressBg: 'bg-amber-500',
        iconBg: 'bg-amber-100', iconColor: 'text-amber-800', icon: 'edit_note',
        title: 'Đã gửi yêu cầu chỉnh sửa', badge: 'Cần bổ sung', badgeBg: 'bg-amber-100', badgeText: 'text-amber-900', badgeBorder: 'border-amber-200',
        message: `Đã gửi yêu cầu chỉnh sửa đề xuất <strong class="text-primary font-mono">${proposalCode}</strong>. <strong>${creatorName}</strong> đã nhận thông báo bổ sung nội dung.`
      };
    }

    setToastConfig(config);
    // Tự động chuyển hướng về danh sách sau 4 giây (khi progress bar chạy xong)
    setTimeout(() => {
      setToastConfig(null);
      navigate('/manager/pending');
    }, 4000);
  };

  const handleActionSubmit = async () => {
    if ((modalType === 'reject' || modalType === 'revise') && !note.trim()) {
      setNoteError('Vui lòng nhập nội dung yêu cầu/lý do.');
      return;
    }

    setActionLoading(true);
    try {
      let endpoint = '';
      if (modalType === 'approve') endpoint = 'approve-manager';
      if (modalType === 'reject') endpoint = 'reject';
      if (modalType === 'revise') endpoint = 'request-revision';

      await apiClient.post(`/proposals/${id}/${endpoint}`, { note: note.trim() });
      
      const currentModalType = modalType;
      closeModal();
      showToastAndNavigate(currentModalType, proposal.code, proposal.creatorName);

    } catch (err) {
      alert(err.message || 'Có lỗi xảy ra khi xử lý đề xuất');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background">
        <div className="text-primary font-medium flex flex-col items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
          Đang tải dữ liệu đề xuất...
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-background">
        <div className="text-error font-medium text-center">
          <span className="material-symbols-outlined text-5xl mb-2">error</span>
          <p>{error || 'Có lỗi xảy ra!'}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-primary hover:underline">Quay lại</button>
        </div>
      </div>
    );
  }

  const attachments = proposal.attachments || [];
  const daysRemaining = getDaysRemaining(proposal.requiredDate);
  const totalItemsCount = proposal.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

  return (
    <div className="relative min-h-screen bg-background pb-28">
      {/* Toast Notification Container */}
      <ToastNotification show={!!toastConfig} config={toastConfig} onClose={() => setToastConfig(null)} />

      {/* ================= CANVAS CONTENT ================= */}
      <main className="flex-1 px-8 py-6 max-w-[1600px] w-full mx-auto">
        
        {/* 1. Breadcrumb & Header Section */}
        <section className="mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
              <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold cursor-pointer">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Quay lại danh sách</span>
              </button>
              <span className="text-outline-variant">/</span>
              <span>Hệ thống phê duyệt</span>
              <span className="text-outline-variant">/</span>
              <span>Danh sách chờ duyệt</span>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface font-semibold">Chi tiết đề xuất {proposal.code}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-xs">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>Cấp phê duyệt hiện tại: <strong>{user?.fullName} ({user?.position || 'Quản lý'})</strong></span>
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-headline-md font-headline-md font-bold text-on-surface tracking-tight font-mono">{proposal.code}</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-low text-primary border border-outline-variant">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                  <span>{mapStatus(proposal.status)}</span>
                </span>
              </div>
              <div className="flex items-center gap-4 text-body-sm font-body-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">calendar_today</span>
                  Ngày gửi: <strong className="text-on-surface">{formatDateTime(proposal.createdAt)}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">domain</span>
                  Cơ sở: <strong className="text-on-surface">Cơ sở Hà Nội - Cầu Giấy</strong>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Grid Layout (Thông tin chính) */}
        <div className="grid grid-cols-1 gap-6 items-start w-full">
          <div className="flex flex-col gap-6 w-full lg:col-span-12">
            
            {/* Card 1: Thông tin phiếu đề xuất */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-lowest">
                <div className="flex items-center gap-2 text-on-surface font-headline-sm font-bold">
                  <span className="material-symbols-outlined text-primary text-xl">description</span>
                  <h2>Thông tin phiếu đề xuất</h2>
                </div>
                <span className="text-caption font-caption text-on-surface-variant">Mã hệ thống: #{proposal.id}</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
                  <div>
                    <span className="text-caption font-caption text-on-surface-variant block mb-1">Mã đề xuất</span>
                    <span className="text-body-md font-mono font-bold text-primary">{proposal.code}</span>
                  </div>
                  <div>
                    <span className="text-caption font-caption text-on-surface-variant block mb-1">Người tạo đề xuất</span>
                    <div className="flex items-center gap-2.5">
                      <img className="w-8 h-8 rounded-full object-cover border border-outline-variant" src={`https://ui-avatars.com/api/?name=${proposal.creatorName}&background=0D8ABC&color=fff`} alt="Avatar" />
                      <div>
                        <p className="text-body-sm font-semibold text-on-surface">{proposal.creatorName}</p>
                        <p className="text-caption text-on-surface-variant leading-none">{proposal.creatorPosition}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-caption font-caption text-on-surface-variant block mb-1">Nhóm chuyên môn</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-container text-primary border border-surface-container-high">
                      {proposal.creatorGroupName || 'Đang cập nhật'}
                    </span>
                  </div>
                  <div>
                    <span className="text-caption font-caption text-on-surface-variant block mb-1">Mức độ ưu tiên</span>
                    {proposal.priority === 'HIGH' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-tertiary-fixed text-tertiary border border-tertiary-fixed-dim">
                        <span className="material-symbols-outlined text-sm">local_fire_department</span>
                        Ưu tiên cao
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-container text-primary border border-outline-variant">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {mapPriority(proposal.priority)}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-caption font-caption text-on-surface-variant block mb-1">Loại giáo cụ</span>
                    <p className="text-body-sm font-medium text-on-surface">{proposal.items?.[0]?.name || 'Không xác định'} {proposal.items?.length > 1 ? '& các giáo cụ khác' : ''}</p>
                    <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-caption bg-surface-container-low text-on-surface-variant">Giáo cụ trung tâm</span>
                  </div>
                  <div>
                    <span className="text-caption font-caption text-on-surface-variant block mb-1">Số lượng & ĐVT</span>
                    <p className="text-body-sm font-semibold text-on-surface">{totalItemsCount} sản phẩm</p>
                    <p className="text-caption text-on-surface-variant">Tổng {proposal.items?.length || 0} danh mục giáo cụ</p>
                  </div>
                  <div>
                    <span className="text-caption font-caption text-on-surface-variant block mb-1">Thời gian cần hàng</span>
                    <div className="flex items-center gap-2">
                      <span className="text-body-md font-semibold text-on-surface">{formatDateOnly(proposal.requiredDate)}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${daysRemaining < 0 ? 'bg-tertiary-fixed text-tertiary' : 'bg-surface-container text-primary'}`}>
                        <span className="material-symbols-outlined text-xs">event_upcoming</span>
                        {daysRemaining < 0 ? `Đã qua ${Math.abs(daysRemaining)} ngày` : `Còn ${daysRemaining} ngày`}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-caption font-caption text-on-surface-variant block mb-1">Đơn giá dự kiến</span>
                    <span className="text-body-sm font-medium text-on-surface">{getPriceRange(proposal.items)}</span>
                  </div>
                  <div className="md:col-span-2">
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/80 flex items-center justify-between">
                      <div>
                        <span className="text-caption font-caption uppercase tracking-wider text-on-surface-variant font-semibold block">Tổng chi phí dự kiến (Đã gồm VAT)</span>
                        <span className="text-caption text-on-surface-variant">Nguồn chi: Quỹ hoạt động {proposal.creatorGroupName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-headline-lg font-headline-lg font-bold font-mono text-primary">{formatCurrency(proposal.estimatedTotal)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-caption font-caption text-on-surface-variant block mb-1.5 font-semibold">Mục đích sử dụng & Lý do đề xuất</span>
                    <div className="bg-surface-bright p-4 rounded-lg border border-outline-variant/60 text-body-sm font-body-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                      {proposal.purpose}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Danh mục giáo cụ chi tiết */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-on-surface font-headline-sm font-bold">
                  <span className="material-symbols-outlined text-primary text-xl">list_alt</span>
                  <h2>Danh mục giáo cụ chi tiết</h2>
                </div>
                <span className="text-caption font-caption bg-surface-container px-2 py-0.5 rounded text-primary font-semibold">{proposal.items?.length || 0} hạng mục</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/70 text-on-surface-variant text-caption font-caption uppercase tracking-wider">
                      <th className="py-3 px-4">Tên giáo cụ & Quy cách</th>
                      <th className="py-3 px-4 text-center">ĐVT</th>
                      <th className="py-3 px-4 text-right">Số lượng</th>
                      <th className="py-3 px-4 text-right">Đơn giá dự kiến</th>
                      <th className="py-3 px-4 text-right">Thành tiền (VND)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40 text-body-sm font-body-sm">
                    {proposal.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-on-surface">{item.name}</div>
                          <div className="text-caption text-on-surface-variant">{mapCategory(item.category)}</div>
                        </td>
                        <td className="py-3 px-4 text-center text-on-surface-variant">{item.unit}</td>
                        <td className="py-3 px-4 text-right font-medium">{item.quantity}</td>
                        <td className="py-3 px-4 text-right font-mono text-on-surface">{formatCurrency(item.price)}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-primary">{formatCurrency(item.quantity * item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-container-low font-semibold text-on-surface border-t border-outline-variant">
                      <td className="py-3 px-4 text-right text-body-sm uppercase" colSpan="4">Tổng cộng:</td>
                      <td className="py-3 px-4 text-right font-mono text-headline-sm font-bold text-primary">{formatCurrency(proposal.estimatedTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Card 3: File tài liệu đính kèm */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/80 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-on-surface font-headline-sm font-bold">
                  <span className="material-symbols-outlined text-primary text-xl">attach_file</span>
                  <h2>File tài liệu đính kèm ({attachments.length})</h2>
                </div>
                <span className="text-caption text-on-surface-variant hidden sm:inline-block">Định dạng hỗ trợ: PDF, PNG, JPG, DOCX</span>
              </div>
              
              <div className="flex flex-col gap-3">
                {attachments.length > 0 ? (
                  attachments.map((file, idx) => {
                    const iconInfo = getFileIconInfo(file.fileName);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-outline-variant/70 bg-surface hover:bg-surface-container-low transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-lg ${iconInfo.bg} ${iconInfo.color} flex items-center justify-center font-bold text-xs shrink-0`}>
                            {iconInfo.text}
                          </div>
                          <div className="truncate pr-4">
                            <p className="text-body-sm font-medium text-on-surface truncate" title={file.fileName}>{file.fileName}</p>
                            <p className="text-caption text-on-surface-variant">Tải lên bởi {proposal.creatorName}</p>
                          </div>
                        </div>
                        {file.fileUrl && (
                          <div className="flex items-center gap-2 shrink-0">
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface text-caption font-semibold transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-sm">visibility</span>
                              <span className="hidden sm:inline-block">Xem tệp</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 px-4 bg-surface border border-dashed border-outline-variant rounded-lg">
                    <span className="material-symbols-outlined text-outline text-3xl mb-2">folder_off</span>
                    <p className="text-body-sm font-medium text-on-surface-variant">Không có file đính kèm nào được tải lên</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ================= STICKY ACTION BAR CỐ ĐỊNH DƯỚI CÙNG ================= */}
      <div className="fixed bottom-0 left-[260px] right-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/80 px-8 py-3.5 shadow-lg flex items-center justify-between">
        {/* Left side summary info */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">folder_open</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-body-md text-on-surface">{proposal.code}</span>
              <span className="text-on-surface-variant text-caption">•</span>
              <span className="text-body-sm text-on-surface-variant">{proposal.items?.[0]?.name || 'Phiếu mua sắm giáo cụ'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-caption text-on-surface-variant">Tổng dự toán:</span>
              <span className="font-mono font-bold text-primary text-body-lg">{formatCurrency(proposal.estimatedTotal)}</span>
            </div>
          </div>
        </div>
        
        {/* Right side 3 action buttons (Only show if pending manager) */}
        {proposal.status === 'PENDING_MANAGER' && (
          <div className="flex items-center gap-3">
            <button onClick={() => setModalType('reject')} className="border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 font-medium px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-sm" type="button">
              <span className="material-symbols-outlined text-lg">close</span>
              <span>Từ chối</span>
            </button>
            <button onClick={() => setModalType('revise')} className="border border-amber-300 text-amber-700 bg-white hover:bg-amber-50 font-medium px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-sm" type="button">
              <span className="material-symbols-outlined text-lg">edit_note</span>
              <span>Yêu cầu chỉnh sửa</span>
            </button>
            <button onClick={() => setModalType('approve')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-sm shadow-emerald-200 cursor-pointer" type="button">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>Đồng ý phê duyệt</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}
      
      {/* 1. Modal: Đồng ý phê duyệt */}
      {modalType === 'approve' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-outline-variant w-full max-w-lg overflow-hidden transform transition-all">
            <div className="flex items-center justify-between p-6 border-b border-outline-variant bg-white">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">Xác nhận đồng ý</h2>
                    <span className="bg-emerald-100 text-emerald-800 text-caption font-caption font-semibold px-2 py-0.5 rounded-full ml-2.5">Quản lý duyệt</span>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Phê duyệt nhu cầu mua sắm</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors focus:outline-none">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <p className="text-body-md font-body-md font-medium text-slate-800 leading-snug">
                Bạn có chắc chắn muốn đồng ý nhu cầu mua sắm của đề xuất <span className="font-mono font-bold text-primary">{proposal.code}</span>?
              </p>
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3.5 shadow-inner">
                <div className="flex items-start justify-between text-body-sm font-body-sm pb-2.5 border-b border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-caption font-caption">Mã đề xuất & Người tạo</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-primary">{proposal.code}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-medium text-slate-800">{proposal.creatorName}</span>
                    </div>
                  </div>
                  <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-caption font-caption text-slate-600 shrink-0">{proposal.creatorGroupName}</span>
                </div>
                <div className="text-body-sm font-body-sm">
                  <span className="text-slate-500 block text-caption font-caption">Loại giáo cụ đề xuất</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-medium text-slate-900">{proposal.items?.[0]?.name || 'Không có tên'} {proposal.items?.length > 1 ? '& các giáo cụ khác' : ''}</span>
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-caption font-caption font-medium px-2 py-0.5 rounded">Giáo cụ tương tác</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-body-sm font-body-sm">
                  <div>
                    <span className="text-slate-500 block text-caption font-caption">Số lượng & Đơn vị tính</span>
                    <span className="font-medium text-slate-800">{totalItemsCount} sản phẩm</span>
                  </div>
                  <span className="text-caption font-caption text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full font-medium">{proposal.items?.length || 0} danh mục</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between bg-white/70 -mx-4 -mb-4 p-4 rounded-b-xl border-x-0">
                  <span className="text-caption font-caption font-medium text-slate-600">Tổng chi phí dự kiến (Đã gồm VAT)</span>
                  <div className="text-right">
                    <span className="text-headline-md font-headline-md font-bold text-primary font-mono tracking-tight">{formatCurrency(proposal.estimatedTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 text-xl shrink-0 mt-0.5">info</span>
                <p className="text-body-sm font-body-sm text-blue-900 leading-relaxed">
                  Đề xuất sẽ được chuyển sang bước kiểm tra ngân sách và Kế toán sẽ nhận được thông báo.
                </p>
              </div>
              <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                    Ý kiến phê duyệt nội bộ (Không bắt buộc)
                  </label>
                  <textarea 
                    value={note} onChange={(e) => setNote(e.target.value)}
                    className="w-full min-h-[80px] p-3 text-sm text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
                    placeholder="Nhập ý kiến (nếu có)..." rows="2"
                  ></textarea>
              </div>
            </div>

            <div className="p-4 px-6 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-end gap-3">
              <button onClick={closeModal} className="border border-slate-300 text-slate-700 hover:bg-slate-100 font-label-md text-label-md font-medium px-5 py-2.5 rounded-lg transition-colors duration-150">Hủy</button>
              <button onClick={handleActionSubmit} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-label-md text-label-md font-semibold px-5 py-2.5 rounded-lg shadow-sm shadow-emerald-200 flex items-center gap-2 transition-all duration-150 active:scale-[0.98]">
                <span className={`material-symbols-outlined text-lg leading-none ${actionLoading ? 'animate-spin' : ''}`}>{actionLoading ? 'sync' : 'check'}</span>
                <span>{actionLoading ? 'Đang xử lý...' : 'Xác nhận đồng ý'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Từ chối HOẶC Yêu cầu chỉnh sửa */}
      {(modalType === 'reject' || modalType === 'revise') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in" role="dialog">
          <div className="w-full max-w-[540px] bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden transition-all transform flex flex-col max-h-[942px]">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${modalType === 'reject' ? 'bg-rose-50 border border-rose-200 text-rose-600' : 'bg-amber-50 border border-amber-200 text-amber-600'}`}>
                  <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {modalType === 'reject' ? 'cancel' : 'edit_note'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight" id="modal-title">
                      {modalType === 'reject' ? 'Từ chối đề xuất' : 'Yêu cầu chỉnh sửa'}
                    </h2>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${modalType === 'reject' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>Quản lý duyệt</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 font-body-sm">
                    {modalType === 'reject' ? 'Từ chối nhu cầu mua sắm giáo cụ' : 'Gửi phản hồi yêu cầu người tạo cập nhật lại thông tin đề xuất'}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer focus:outline-none">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-140px)]">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Mã đề xuất:</span>
                    <span className="font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-xs">{proposal.code}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-medium">Tổng chi phí:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(proposal.estimatedTotal)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 min-w-[70px]">Người tạo:</span>
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <span className="material-symbols-outlined text-slate-400 text-[16px]">account_circle</span>
                      <span>{proposal.creatorName} ({proposal.creatorPosition})</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 min-w-[70px]">Giáo cụ:</span>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="material-symbols-outlined text-slate-400 text-[16px]">category</span>
                      <span>{proposal.items?.[0]?.name || 'Không có tên'} {proposal.items?.length > 1 ? '& các giáo cụ khác' : ''} ({proposal.items?.length || 0} danh mục)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    {modalType === 'reject' ? 'Lý do từ chối' : 'Nội dung cần chỉnh sửa'} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-mono">{note.length}/500 ký tự</span>
                </div>
                <div className="relative">
                  <textarea 
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      if (e.target.value.trim()) setNoteError('');
                    }}
                    maxLength={500}
                    className={`w-full rounded-lg p-3 text-sm transition-all resize-none focus:outline-none focus:ring-2 ${noteError ? 'border-2 border-red-500 bg-red-50/40 text-slate-900 focus:ring-red-400/30' : 'border border-slate-300 bg-white focus:border-primary focus:ring-primary/20'}`}
                    placeholder={`Nhập ${modalType === 'reject' ? 'lý do từ chối' : 'nội dung cần giáo viên chỉnh sửa'}...`} 
                    rows="4"
                  ></textarea>
                </div>
                {noteError && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-red-600 font-medium">
                    <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
                    <span>{noteError}</span>
                  </div>
                )}
              </div>

              <div className={`${modalType === 'reject' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'} border rounded-xl p-3.5 flex items-start gap-3 mt-4`}>
                <span className={`material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5 ${modalType === 'reject' ? 'text-rose-600' : 'text-amber-600'}`}>
                  warning
                </span>
                <p className={`text-xs leading-relaxed font-body-sm ${modalType === 'reject' ? 'text-rose-900' : 'text-amber-900'}`}>
                  {modalType === 'reject' 
                    ? <span>Sau khi xác nhận từ chối, đề xuất sẽ bị đóng lại. Người tạo đề xuất và các cấp liên quan sẽ nhận được thông báo kèm lý do này.</span> 
                    : <span>Sau khi gửi, đề xuất sẽ chuyển về trạng thái <strong>Yêu cầu chỉnh sửa</strong> và giáo viên sẽ nhận được thông báo để bổ sung thông tin.</span>}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100 px-6 pb-6 bg-slate-50/50">
              <button onClick={closeModal} className="border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer">Hủy</button>
              <button 
                onClick={handleActionSubmit} 
                disabled={actionLoading}
                className={`text-white font-semibold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer ${modalType === 'reject' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 active:bg-rose-800' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 active:bg-amber-700'} ${actionLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                <span className={`material-symbols-outlined text-[18px] ${actionLoading ? 'animate-spin' : ''}`}>
                  {actionLoading ? 'sync' : (modalType === 'reject' ? 'block' : 'edit_square')}
                </span>
                <span>{actionLoading ? 'Đang xử lý...' : (modalType === 'reject' ? 'Xác nhận từ chối' : 'Xác nhận yêu cầu chỉnh sửa')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ManagerProposalDetail;