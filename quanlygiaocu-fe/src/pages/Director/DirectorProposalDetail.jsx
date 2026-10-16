// src/pages/Director/DirectorProposalDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

// --- Helpers ---
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
const formatDateOnly = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const mapCategory = (categoryEnum) => {
  const categoryMap = { 'PEN': 'Bút', 'PAPER': 'Giấy', 'FLASHCARD': 'Thẻ từ vựng', 'BOOK': 'Sách', 'AUDIO_DEVICE': 'Thiết bị', 'OTHER': 'Khác' };
  return categoryMap[categoryEnum] || categoryEnum;
};

// --- Format Kỳ Ngân Sách ---
const formatPeriodLabel = (label) => {
  if (!label) return '';
  const match = label.match(/Quý\s*(\d)\s*\/?\s*(\d{4})/i);
  if (match) {
    const q = parseInt(match[1], 10);
    const y = match[2];
    switch (q) {
      case 1: return `Quý 1/${y} (Tháng 01 - Tháng 03/${y})`;
      case 2: return `Quý 2/${y} (Tháng 04 - Tháng 06/${y})`;
      case 3: return `Quý 3/${y} (Tháng 07 - Tháng 09/${y})`;
      case 4: return `Quý 4/${y} (Tháng 10 - Tháng 12/${y})`;
      default: return label;
    }
  }
  return label; 
};

// --- Toast Component ---
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

export default function DirectorProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // modalType có thể là: 'approve' | 'reject' | 'revise'
  const [modalType, setModalType] = useState(null); 
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [toastConfig, setToastConfig] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proposalData, budgetData] = await Promise.all([
          apiClient.get(`/proposals/${id}`),
          apiClient.get(`/proposals/${id}/budget-check`)
        ]);
        setProposal(proposalData);
        setBudgetInfo(budgetData);
      } catch (error) {
        alert(error.response?.data?.message || 'Lỗi kết nối khi lấy dữ liệu.');
        navigate('/director/pending-approvals');
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
    if ((modalType === 'reject' || modalType === 'revise') && !note.trim()) {
      setNoteError('Vui lòng nhập lý do/yêu cầu chi tiết.');
      return;
    }

    setActionLoading(true);
    try {
      // ĐIỀU CHỈNH ENDPOINT PHÙ HỢP VỚI BACKEND CỦA BẠN
      let endpoint = '';
      if (modalType === 'approve') endpoint = 'approve-director';
      else if (modalType === 'reject') endpoint = 'reject-director';
      else endpoint = 'request-revision';
      
      await apiClient.post(`/proposals/${id}/${endpoint}`, { note: note.trim() });
      
      const currentType = modalType;
      closeModal();
      
      let config = {};
      if (currentType === 'approve') {
        config = {
          borderColor: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
          titleColor: 'text-emerald-900', badgeBg: 'bg-emerald-100', badgeColor: 'text-emerald-700',
          icon: 'check_circle', title: 'Phê duyệt thành công',
          message: `Đã duyệt chi cho đề xuất <strong class="text-primary font-mono">${proposal.code}</strong>. Hồ sơ chuyển sang Hành chính mua sắm.`
        };
      } else if (currentType === 'reject') {
        config = {
          borderColor: 'border-rose-200', iconBg: 'bg-rose-100', iconColor: 'text-rose-600',
          titleColor: 'text-rose-900', badgeBg: 'bg-rose-100', badgeColor: 'text-rose-700',
          icon: 'cancel', title: 'Đã từ chối đề xuất',
          message: `Đã hủy duyệt chi <strong class="text-primary font-mono">${proposal.code}</strong>. Các bên liên quan đã nhận thông báo.`
        };
      } else {
        config = {
          borderColor: 'border-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
          titleColor: 'text-amber-900', badgeBg: 'bg-amber-100', badgeColor: 'text-amber-700',
          icon: 'edit_note', title: 'Đã yêu cầu chỉnh sửa',
          message: `Yêu cầu hiệu chỉnh <strong class="text-primary font-mono">${proposal.code}</strong> đã được gửi về người tạo.`
        };
      }
      setToastConfig(config);

      setTimeout(() => {
        setToastConfig(null);
        navigate('/director/pending-approvals');
      }, 3500);

    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý.');
    } finally {
      setActionLoading(false);
    }
  };

  const getAccountantApprovalDate = () => {
    if (!proposal || !proposal.histories) return proposal?.createdAt;
    const history = proposal.histories.find(h => h.actionLabel.toLowerCase().includes('ngân sách'));
    return history ? history.createdAt : proposal.createdAt;
  };

  if (loading || !proposal || !budgetInfo) {
    return <div className="flex justify-center items-center min-h-screen"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;
  }

  const allocated = budgetInfo.allocatedAmount || 0;
  const spent = budgetInfo.spentAmount || 0;
  const committed = budgetInfo.committedAmount || 0;
  const availableBefore = budgetInfo.availableBeforeApproval || 0;
  const proposalTotal = budgetInfo.proposalEstimatedTotal || 0;
  const availableAfter = budgetInfo.remainingIfApproved || 0;

  const baseAllocated = allocated > 0 ? allocated : 1; 
  const pctUsed = ((spent + committed) / baseAllocated) * 100;
  const totalItemsQuantity = proposal.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <ToastNotification show={!!toastConfig} config={toastConfig} onClose={() => setToastConfig(null)} />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <span>Trang chủ</span> <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span>Đề xuất chờ duyệt chi</span> <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-slate-900 font-semibold">Chi tiết {proposal.code}</span>
          </nav>
          <button onClick={() => navigate(-1)} className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại danh sách
          </button>
        </div>

        {/* Banner Tổng */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-mono text-slate-900">{proposal.code}</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">Chờ duyệt chi</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 pt-3 text-sm text-slate-600">
            <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">verified</span> Ngày Kế toán xác nhận: <strong className="text-slate-900 font-mono">{formatDateOnly(getAccountantApprovalDate())}</strong></div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">domain</span> Cơ sở: <strong className="text-slate-900">Hà Nội - Cầu Giấy</strong></div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">event</span> Hạn cần hàng: <strong className="text-red-600 font-mono">{formatDateOnly(proposal.requiredDate)}</strong></div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">child_care</span> {proposal.creatorGroupName || 'Khối chuyên môn'}</div>
          </div>
        </section>

        <div className="grid grid-cols-12 gap-6">
          {/* KHỐI 1: THÔNG TIN PHIẾU ĐỀ XUẤT */}
          <section className="col-span-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">description</span>
                <h2 className="text-lg font-semibold text-slate-900">Thông tin phiếu đề xuất</h2>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-50 text-xs text-primary border border-slate-200">Chỉ đọc / Cấp Giám đốc thẩm định</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5 text-sm">
              <div className="flex flex-col"><span className="text-slate-500 mb-1">Mã đề xuất:</span><span className="font-mono font-bold text-primary">{proposal.code}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-1">Người tạo đề xuất:</span><span className="font-medium text-slate-900">{proposal.creatorName}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-1">Nhóm chuyên môn:</span><span className="w-max px-2.5 py-0.5 rounded-full bg-slate-50 text-primary border border-slate-200">{proposal.creatorGroupName}</span></div>
              <div className="flex flex-col"><span className="text-slate-500 mb-1">Thời gian cần hàng:</span><span className="font-medium text-slate-900">{formatDateOnly(proposal.requiredDate)}</span></div>
              <div className="flex flex-col">
                <span className="text-slate-500 mb-1">Mức độ ưu tiên:</span>
                <span className={`w-max px-2.5 py-0.5 rounded-full text-xs font-semibold ${proposal.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {proposal.priority === 'HIGH' ? 'Ưu tiên Cao' : 'Trung bình'}
                </span>
              </div>
              <div className="col-span-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Mục đích sử dụng & Diễn giải chi tiết:</span>
                <p className="text-slate-800 leading-relaxed">{proposal.purpose}</p>
              </div>
            </div>
          </section>

          {/* KHỐI 2: THẨM ĐỊNH TÀI CHÍNH CỦA KẾ TOÁN */}
          <section className="col-span-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-5 rounded-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#dcfce7] mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#166534] shadow-sm"><span className="material-symbols-outlined text-[20px]">account_balance_wallet</span></div>
                  <h3 className="text-lg font-semibold text-slate-900">Xác nhận thẩm định tài chính khả dụng</h3>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#166534] border border-[#bbf7d0]">
                  <span className="material-symbols-outlined text-[14px]">verified</span> Đã xác nhận (Kế toán)
                </span>
              </div>
              
              <div className="p-3 bg-white rounded-lg border border-[#dcfce7] mt-4">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-600 font-medium">Nguồn: Ngân sách hoạt động {formatPeriodLabel(budgetInfo.periodLabel)}</span>
                  <span className="text-[#166534] font-bold">Đủ điều kiện thanh toán 100%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-1.5">
                  <div className="bg-[#16a34a] h-2.5 rounded-full" style={{ width: `${Math.min(pctUsed, 100)}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Hạn mức còn lại: <strong className="text-slate-900 font-mono">{formatCurrency(availableBefore)}</strong></span>
                  <span>Tổng quỹ Q1: <strong className="text-slate-900 font-mono">{formatCurrency(allocated)}</strong></span>
                </div>
              </div>
            </div>
          </section>

          {/* KHỐI 3: DANH SÁCH GIÁO CỤ */}
          <section className="col-span-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                <h2 className="text-lg font-semibold text-slate-900">Bảng chi tiết danh mục giáo cụ</h2>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase h-10">
                    <th className="py-2 px-3 text-center">#</th>
                    <th className="py-2 px-3">Tên giáo cụ & Quy cách</th>
                    <th className="py-2 px-3 text-center">SL</th>
                    <th className="py-2 px-3 text-center">ĐVT</th>
                    <th className="py-2 px-3 text-right">Đơn giá (VNĐ)</th>
                    <th className="py-2 px-3 text-right">Thành tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {proposal.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3"><div className="font-medium text-slate-900">{item.name}</div><div className="text-xs text-slate-500">{mapCategory(item.category)}</div></td>
                      <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-3 px-3 text-center text-slate-500">{item.unit}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatCurrency(item.price)}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 text-sm font-bold border-t border-slate-200">
                    <td className="py-3 px-4" colSpan="2">Tổng cộng ({proposal.items?.length || 0} danh mục):</td>
                    <td className="py-3 px-3 text-center font-mono">{totalItemsQuantity}</td>
                    <td className="py-3 px-3 text-center">SP</td>
                    <td className="py-3 px-3 text-right text-slate-500 text-xs">Tổng chi phí:</td>
                    <td className="py-3 px-3 text-right font-mono text-primary text-lg">{formatCurrency(proposalTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* KHỐI 4: TÀI LIỆU */}
          <section className="col-span-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">attach_file</span>
                <h2 className="text-lg font-semibold text-slate-900">File đính kèm & Chứng từ thẩm định</h2>
              </div>
              <span className="text-xs text-slate-500">{proposal.attachments?.length || 0} tệp đính kèm</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {proposal.attachments && proposal.attachments.length > 0 ? (
                proposal.attachments.map((file, idx) => {
                  const iconInfo = getFileIconInfo(file.fileName);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconInfo.bg} ${iconInfo.color}`}><span className="material-symbols-outlined text-[22px]">{iconInfo.icon}</span></div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{file.fileName}</div>
                          <div className="text-xs text-slate-500">Tệp tài liệu xác minh</div>
                        </div>
                      </div>
                      {file.fileUrl && (
                        <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"><span className="material-symbols-outlined text-[18px]">download</span></a>
                      )}
                    </div>
                  );
                })
              ) : <div className="text-sm text-slate-500 italic text-center p-4">Không có file đính kèm</div>}
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER ACTIONS CỐ ĐỊNH */}
      <footer className="fixed bottom-0 left-[260px] right-0 h-20 bg-white border-t border-slate-200 px-8 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
        <div className="flex items-center gap-6">
          <div><span className="text-xs text-slate-500 block">Mã hồ sơ</span><span className="text-lg font-mono font-bold text-slate-900">{proposal.code}</span></div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div><span className="text-xs text-slate-500 block">Tổng chi phí xin duyệt:</span><span className="text-xl font-mono font-bold text-primary">{formatCurrency(proposalTotal)}</span></div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setModalType('reject')} className="border border-red-500 text-red-600 hover:bg-red-50 font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">close</span> Từ chối
          </button>
          <button onClick={() => setModalType('revise')} className="border border-amber-600 text-amber-800 hover:bg-amber-50 font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">edit_note</span> Yêu cầu chỉnh sửa
          </button>
          <button onClick={() => setModalType('approve')} className="bg-[#006e2d] hover:bg-[#005320] text-white font-semibold px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span> Đồng ý duyệt chi
          </button>
        </div>
      </footer>

      {/* MODALS */}
      {modalType && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col ${modalType === 'approve' ? 'max-w-[460px]' : 'max-w-[480px]'}`}>
            <div className="px-6 pt-6 pb-2 flex items-start justify-between">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${modalType === 'approve' ? 'bg-emerald-50 text-emerald-600' : modalType === 'reject' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {modalType === 'approve' ? 'check_circle' : modalType === 'reject' ? 'cancel' : 'edit_note'}
                </span>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 p-1"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="px-6 pb-6">
              <h2 className="text-[20px] font-bold text-slate-900 mb-1">
                {modalType === 'approve' ? 'Xác nhận duyệt chi' : modalType === 'reject' ? 'Từ chối đề xuất' : 'Yêu cầu chỉnh sửa'}
              </h2>
              <p className="text-[13px] text-slate-500 mb-4">
                {modalType === 'approve' ? 'Hồ sơ sẽ chuyển Phòng Hành chính mua sắm' : modalType === 'reject' ? 'Từ chối và đóng hoàn toàn đề xuất này' : 'Trả hồ sơ về Người tạo để cập nhật lại'}
              </p>

              {modalType === 'approve' && (
                <>
                  <p className="text-[13.5px] text-slate-700 mb-4 leading-relaxed">
                    Bạn có chắc chắn muốn duyệt chi đề xuất <strong className="text-primary font-mono">{proposal.code}</strong> với tổng kinh phí <strong className="text-primary font-mono">{formatCurrency(proposalTotal)}</strong>?
                  </p>
                  <div className="bg-[#f0f7ff] border border-[#d6e8ff] rounded-xl p-3.5 flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#2563eb] text-[18px] shrink-0 mt-0.5">info</span>
                    <p className="text-[13px] text-[#1e3a8a] leading-relaxed">Sau khi xác nhận, đề xuất sẽ chuyển sang trạng thái <strong>Đã duyệt</strong> và chờ Phòng Hành chính tiến hành đặt mua.</p>
                  </div>
                </>
              )}

              {(modalType === 'reject' || modalType === 'revise') && (
                <>
                  <div className="space-y-1.5 mb-5">
                    <label className="text-[13px] font-bold text-slate-800">{modalType === 'reject' ? 'Lý do từ chối' : 'Yêu cầu cần chỉnh sửa'} <span className="text-rose-500">*</span></label>
                    <textarea 
                      value={note} onChange={(e) => { setNote(e.target.value); setNoteError(''); }}
                      className={`w-full rounded-lg p-3 text-[13px] resize-none outline-none border ${noteError ? 'border-rose-500 bg-rose-50' : 'border-slate-300 focus:border-primary'}`}
                      placeholder={modalType === 'reject' ? "Nhập lý do từ chối..." : "Nhập yêu cầu cần bổ sung/chỉnh sửa..."} rows="3"
                    ></textarea>
                    {noteError && <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-[14px]">error</span>{noteError}</span>}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium text-[13px] transition-colors">Hủy</button>
              <button 
                onClick={handleActionSubmit} disabled={actionLoading}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-white font-semibold text-[13px] transition-colors ${actionLoading ? 'opacity-70 cursor-wait' : ''} ${modalType === 'approve' ? 'bg-[#059669] hover:bg-[#047857]' : modalType === 'reject' ? 'bg-[#dc2626] hover:bg-[#b91c1c]' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                <span className={`material-symbols-outlined text-[18px] ${actionLoading ? 'animate-spin' : ''}`}>{actionLoading ? 'sync' : modalType === 'approve' ? 'check' : modalType === 'reject' ? 'cancel' : 'send'}</span>
                {actionLoading ? 'Đang xử lý...' : modalType === 'approve' ? 'Xác nhận duyệt' : modalType === 'reject' ? 'Xác nhận từ chối' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}