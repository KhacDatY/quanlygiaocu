// src/pages/Administrative/AdminProposalDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { AuthContext } from '../../contexts/AuthContext';

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

const getDaysRemaining = (dateString) => {
  if (!dateString) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getFileIconInfo = (fileName) => {
  if (!fileName) return { text: 'FILE', bg: 'bg-surface-container', color: 'text-primary' };
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf') return { text: 'PDF', bg: 'bg-red-100', color: 'text-error' };
  if (['png', 'jpg', 'jpeg'].includes(ext)) return { text: 'IMG', bg: 'bg-surface-container', color: 'text-primary' };
  if (['xls', 'xlsx'].includes(ext)) return { text: 'XLS', bg: 'bg-emerald-100', color: 'text-secondary' };
  if (['doc', 'docx'].includes(ext)) return { text: 'DOC', bg: 'bg-primary-container', color: 'text-on-primary-container' };
  return { text: ext.toUpperCase(), bg: 'bg-surface-container', color: 'text-primary' };
};

const getIconName = (fileName) => {
  if (!fileName) return 'description';
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'picture_as_pdf';
  if (['xls', 'xlsx'].includes(ext)) return 'table_view';
  if (['png', 'jpg', 'jpeg'].includes(ext)) return 'image';
  return 'description';
};

const mapStatus = (statusEnum) => {
  const statusMap = {
    'PENDING_MANAGER': 'Chờ duyệt đề xuất',
    'PENDING_ACCOUNTANT': 'Chờ KT duyệt ngân sách',
    'PENDING_DIRECTOR': 'Chờ GĐ duyệt chi',
    'APPROVED': 'Đã duyệt – chưa mua',
    'REJECTED': 'Đã từ chối',
    'NEEDS_REVISION': 'Yêu cầu chỉnh sửa',
    'PURCHASING': 'Đang mua hàng'
  };
  return statusMap[statusEnum] || statusEnum;
};

const mapPriority = (priorityEnum) => {
  const priorityMap = {
    'HIGH': 'Ưu tiên cao',
    'MEDIUM': 'Trung bình',
    'LOW': 'Thấp'
  };
  return priorityMap[priorityEnum] || priorityEnum;
};

const mapCategory = (categoryEnum) => {
  const categoryMap = { 'PEN': 'Bút', 'PAPER': 'Giấy', 'FLASHCARD': 'Thẻ từ vựng', 'BOOK': 'Sách', 'AUDIO_DEVICE': 'Thiết bị âm thanh', 'OTHER': 'Khác' };
  return categoryMap[categoryEnum] || categoryEnum;
};

const mapRole = (roleEnum) => {
  const roleMap = {
    'ACCOUNTANT': 'Kế toán viên (Ban Tài chính - Kế toán)',
    'DIRECTOR': 'Giám đốc Trung tâm',
    'MANAGER': 'Quản lý chuyên môn',
    'ADMINISTRATIVE_STAFF': 'Phòng Hành chính - Quản trị',
    'TEACHER': 'Giáo viên'
  };
  return roleMap[roleEnum] || roleEnum || '(Ban Tài chính - Kế toán)';
};

const getAvatarInitials = (fullName) => {
  if (!fullName) return 'U';
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export default function AdminProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-surface">
        <div className="text-primary font-medium flex flex-col items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
          Đang tải dữ liệu đề xuất...
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-surface">
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

  // Lấy lịch sử Kế toán và Giám đốc
  const accountantHistory = proposal.histories?.find(h => h.actionLabel?.includes('ngân sách') || h.actionLabel?.includes('tài chính') || h.action === 'APPROVED_BUDGET');
  const directorHistory = proposal.histories?.find(h => h.actionLabel?.includes('duyệt chi') || h.actionLabel?.includes('Phê duyệt cuối') || h.action === 'APPROVED_FINAL');

  const directorApprovalDate = directorHistory ? directorHistory.createdAt : proposal.createdAt;

  // Giả lập avatar bg colors based on initial
  const colors = ['bg-rose-100 text-rose-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700', 'bg-sky-100 text-sky-700'];
  const colorClass = colors[proposal.id % colors.length] || colors[0];

  return (
    <div className="relative min-h-screen bg-surface pb-28">
      <main className="flex-1 px-6 py-6 max-w-[1600px] w-full mx-auto">
        
        {/* 1. Breadcrumb & Back Action */}
        <div className="flex items-center justify-between mb-4">
          <nav className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface-variant">
            <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/administrative')}>Trang chủ</span>
            <span className="text-outline">/</span>
            <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/administrative/pending-purchases')}>Đề xuất đã duyệt – chưa mua</span>
            <span className="text-outline">/</span>
            <span className="text-on-surface font-semibold">Chi tiết {proposal.code}</span>
          </nav>
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-body-sm font-label-md text-primary hover:text-primary-container font-semibold transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Quay lại danh sách</span>
          </button>
        </div>

        {/* Header Banner Định Danh */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/70 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-headline-lg font-headline-lg font-mono tracking-tight text-on-surface">{proposal.code}</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>{mapStatus(proposal.status)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-primary">
                  <span className="material-symbols-outlined text-[16px]">business</span>
                  <span>Cấp xử lý hiện tại: Phòng hành chính</span>
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-body-sm font-body-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">event_available</span>
                  Ngày Giám đốc duyệt: <strong className="text-on-surface font-semibold">{formatDateOnly(directorApprovalDate)}</strong>
                </span>
                <span className="text-outline">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">storefront</span>
                  Cơ sở: <strong className="text-on-surface font-semibold">Hà Nội - Cầu Giấy</strong>
                </span>
                <span className="text-outline">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
                  Hạn chót cần hàng: <strong className={`${daysRemaining < 3 ? 'text-error' : 'text-on-surface'} font-semibold`}>{formatDateOnly(proposal.requiredDate)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN CONTENT LAYOUT (1 Column spacing out elements) */}
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 space-y-6">
            
            {/* Card 1: Thông tin phiếu đề xuất (Chỉ đọc) */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/70 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-outline-variant/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                  </div>
                  <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">Thông tin phiếu đề xuất</h2>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-container text-primary border border-outline-variant/50">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  Chế độ xem chỉ đọc
                </span>
              </div>
              
              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 mb-5">
                <div>
                  <label className="block text-caption font-caption text-outline mb-1">Mã đề xuất</label>
                  <div className="font-mono text-body-lg font-semibold text-primary">{proposal.code}</div>
                </div>
                <div>
                  <label className="block text-caption font-caption text-outline mb-1">Người tạo</label>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full font-semibold text-xs flex items-center justify-center ring-1 ring-black/5 ${colorClass}`}>
                      {getAvatarInitials(proposal.creatorName)}
                    </div>
                    <div>
                      <span className="text-body-sm font-semibold text-on-surface">{proposal.creatorName}</span>
                      <span className="block text-caption text-on-surface-variant">{proposal.creatorPosition}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-caption font-caption text-outline mb-1">Nhóm chuyên môn</label>
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    {proposal.creatorGroupName || 'Khối Mầm non'}
                  </span>
                </div>
                <div>
                  <label className="block text-caption font-caption text-outline mb-1">Thời gian cần hàng</label>
                  <div className="text-body-sm font-medium text-on-surface flex items-center gap-1.5">
                    <span className="font-semibold">{formatDateOnly(proposal.requiredDate)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-caption font-caption text-outline mb-1">Mức độ ưu tiên</label>
                  {proposal.priority === 'HIGH' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                      <span className="material-symbols-outlined text-[14px]">priority_high</span> Ưu tiên Cao
                    </span>
                  ) : proposal.priority === 'MEDIUM' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="material-symbols-outlined text-[14px]">schedule</span> Trung bình
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                      <span className="material-symbols-outlined text-[14px]">low_priority</span> Thấp
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-caption font-caption text-outline mb-1">Ngày gửi đề xuất</label>
                  <div className="text-body-sm font-medium text-on-surface">{formatDateTime(proposal.createdAt)}</div>
                </div>
              </div>

              {/* Mục đích sử dụng */}
              <div className="mb-5 bg-surface rounded-lg p-3.5 border border-outline-variant/60">
                <label className="block text-caption font-caption text-outline uppercase font-semibold tracking-wider mb-1">Mục đích sử dụng</label>
                <p className="text-body-sm font-body-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                  {proposal.purpose}
                </p>
              </div>

              {/* Khối Highlight Tổng Chi Phí Dự Kiến */}
              <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="text-label-md font-label-md text-primary font-bold">Tổng chi phí dự kiến đề xuất</div>
                  <div className="text-caption font-caption text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Đã được Ban Giám đốc phê duyệt định mức ngân sách
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-2xl font-bold text-primary tracking-tight">{formatCurrency(proposal.estimatedTotal)}</span>
                </div>
              </div>
            </section>

            {/* Card 2: Bảng chi tiết giáo cụ */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/70 shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">inventory</span>
                  </div>
                  <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">Bảng chi tiết giáo cụ</h2>
                </div>
                <span className="text-caption font-caption font-semibold bg-surface-container px-2.5 py-1 rounded text-primary">
                  {proposal.items?.length || 0} danh mục giáo cụ ({totalItemsCount} sản phẩm)
                </span>
              </div>
              
              <div className="overflow-x-auto rounded-lg border border-outline-variant/60">
                <table className="w-full text-left text-body-sm font-body-sm">
                  <thead className="bg-surface text-on-surface-variant text-caption font-semibold uppercase tracking-wider border-b border-outline-variant/60">
                    <tr>
                      <th className="py-3 px-4" scope="col">Tên giáo cụ & Quy cách</th>
                      <th className="py-3 px-3 text-center" scope="col">SL</th>
                      <th className="py-3 px-3 text-center" scope="col">ĐVT</th>
                      <th className="py-3 px-4 text-right" scope="col">Đơn giá</th>
                      <th className="py-3 px-4 text-right" scope="col">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40 bg-surface-container-lowest">
                    {proposal.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-on-surface">{item.name}</div>
                          <div className="text-caption text-outline">{mapCategory(item.category)}</div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-medium">{item.quantity}</td>
                        <td className="py-3.5 px-3 text-center text-on-surface-variant">{item.unit}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-on-surface">{formatCurrency(item.price)}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-primary">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-surface border-t-2 border-outline-variant/80">
                    <tr>
                      <td className="py-3.5 px-4 text-right font-label-md text-on-surface font-semibold" colSpan="4">
                        Tổng chi phí dự kiến:
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-headline-sm font-bold text-primary">
                        {formatCurrency(proposal.estimatedTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* Card 3: Kết quả kiểm tra ngân sách của Kế toán */}
            <section className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <h3 className="text-headline-sm font-headline-sm text-emerald-900 font-semibold">
                      Đã thẩm định và kiểm tra hạn mức ngân sách
                    </h3>
                    <span className="text-caption font-mono text-emerald-700 font-medium">
                      {accountantHistory ? formatDateTime(accountantHistory.createdAt) : formatDateTime(proposal.createdAt)}
                    </span>
                  </div>
                  <div className="text-body-sm font-body-sm text-emerald-800 mb-2">
                    Xác nhận bởi: <strong className="font-semibold">{accountantHistory?.actorName || 'Kế toán viên'}</strong> — {mapRole(accountantHistory?.actorRole)}
                  </div>
                  {accountantHistory?.note && (
                    <div className="text-body-sm font-body-sm text-emerald-800 italic mt-1">"{accountantHistory.note}"</div>
                  )}
                </div>
              </div>
            </section>

            {/* Card 4: Hồ sơ & File đính kèm */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/70 shadow-sm p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                  </div>
                  <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">Hồ sơ & File đính kèm</h2>
                </div>
                <span className="text-caption font-caption text-outline">{attachments.length} tài liệu đính kèm</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {attachments.length > 0 ? (
                  attachments.map((file, idx) => {
                    const iconInfo = getFileIconInfo(file.fileName);
                    const iconName = getIconName(file.fileName);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/70 bg-surface hover:bg-surface-container-low transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-10 h-10 rounded-lg ${iconInfo.bg} ${iconInfo.color} flex items-center justify-center shrink-0`}>
                            <span className="material-symbols-outlined text-[24px]">{iconName}</span>
                          </div>
                          <div className="truncate">
                            <div className="text-body-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors" title={file.fileName}>{file.fileName}</div>
                            <div className="text-caption text-outline font-mono">Tài liệu đính kèm</div>
                          </div>
                        </div>
                        {file.fileUrl && (
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-surface-container text-outline hover:text-primary transition-colors flex items-center justify-center" title="Tải về">
                              <span className="material-symbols-outlined text-[18px]">download</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-1 sm:col-span-2 text-center p-4 border border-dashed rounded-lg text-on-surface-variant text-body-sm">
                    Không có tài liệu đính kèm.
                  </div>
                )}
              </div>
            </section>
            
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* STICKY ACTION BAR (Fixed bottom)                                          */}
      {/* ========================================================================= */}
      <footer className="fixed bottom-0 left-[260px] right-0 h-20 bg-white/95 backdrop-blur-md border-t border-outline-variant/80 px-8 flex items-center justify-between z-30 shadow-lg">
        {/* Left Details */}
        <div className="flex items-center gap-6">
          <div>
            <div className="text-caption font-caption text-on-surface-variant font-mono">Mã đề xuất: <span className="font-semibold text-on-surface">{proposal.code}</span></div>
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-outline">Tổng chi phí dự kiến:</span>
              <span className="font-mono text-xl font-bold text-primary">{formatCurrency(proposal.estimatedTotal)}</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-primary text-xs font-medium border border-blue-200">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span className="">Ngân sách đã được phê duyệt sẵn sàng xuất chi</span>
          </div>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {proposal.status === 'APPROVED' && (
            <button 
              onClick={() => navigate(`/administrative/purchase-form/${proposal.id}`)}
              className="bg-primary hover:bg-[#173E82] text-white font-label-md text-label-md font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg flex items-center gap-2.5 transition-all duration-200 active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              <span className="">Tạo phiếu xác nhận thông tin mua hàng</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}