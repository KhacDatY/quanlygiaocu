import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function NeedEditProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposalDetail = async () => {
      try {
        const data = await apiClient.get(`/proposals/${id}`);
        setProposal(data);
      } catch (error) {
        alert(error.message || 'Không thể tải chi tiết đề xuất');
      } finally {
        setLoading(false);
      }
    };
    fetchProposalDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] text-primary">
        <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
        <span className="ml-2 font-medium">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-on-surface-variant">
        <span className="material-symbols-outlined text-6xl mb-4 text-outline">assignment_late</span>
        <h2 className="text-headline-md font-bold mb-2">Không tìm thấy đề xuất</h2>
        <button onClick={() => navigate('/teacher/my-proposals')} className="text-primary hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // --- Helpers ---
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  const mapCategory = (categoryEnum) => {
    const categoryMap = { 'PEN': 'Bút', 'PAPER': 'Giấy', 'FLASHCARD': 'Thẻ từ vựng', 'BOOK': 'Sách', 'AUDIO_DEVICE': 'Thiết bị âm thanh', 'OTHER': 'Khác' };
    return categoryMap[categoryEnum] || categoryEnum;
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return 'description';
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'picture_as_pdf';
    if (['png', 'jpg', 'jpeg'].includes(ext)) return 'image';
    if (['xls', 'xlsx'].includes(ext)) return 'table_view';
    return 'description';
  };

  const renderPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-label-sm border border-red-200"><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Cao</span>;
      case 'MEDIUM': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-label-sm border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Trung bình</span>;
      case 'LOW': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-label-sm border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Thấp</span>;
      default: return null;
    }
  };

  const getHistoryStyle = (actionLabel) => {
    if (!actionLabel) return { dot: 'bg-primary', ring: 'ring-primary-fixed', badgeBg: 'bg-primary-fixed', badgeText: 'text-on-primary-fixed' };
    const lowerAction = actionLabel.toLowerCase();
    if (lowerAction.includes('yêu cầu chỉnh sửa')) return { dot: 'bg-amber-500', ring: 'ring-amber-100', badgeBg: 'bg-amber-100', badgeText: 'text-amber-800' };
    if (lowerAction.includes('chờ duyệt')) return { dot: 'bg-blue-500', ring: 'ring-blue-100', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800' };
    if (lowerAction.includes('tạo mới')) return { dot: 'bg-slate-400', ring: 'ring-slate-100', badgeBg: 'bg-slate-100', badgeText: 'text-slate-700' };
    if (lowerAction.includes('duyệt')) return { dot: 'bg-emerald-500', ring: 'ring-emerald-100', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800' };
    if (lowerAction.includes('từ chối')) return { dot: 'bg-rose-500', ring: 'ring-rose-100', badgeBg: 'bg-rose-100', badgeText: 'text-rose-800' };
    return { dot: 'bg-primary', ring: 'ring-primary-fixed', badgeBg: 'bg-primary-fixed', badgeText: 'text-on-primary-fixed' };
  };

  // Lấy ghi chú chỉnh sửa mới nhất từ Lịch sử
  const getRevisionNote = () => {
    if (!proposal || !proposal.histories) return null;
    const revisions = proposal.histories.filter(h => h.actionLabel.includes('Yêu cầu chỉnh sửa'));
    if (revisions.length === 0) return null;
    return revisions[revisions.length - 1]; 
  };

  const revisionNote = getRevisionNote();
  const totalItemsCount = proposal.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-24 bg-surface">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Breadcrumbs & Heading */}
        <div>
          <nav className="flex items-center gap-2 text-on-surface-variant font-body-sm mb-2">
            <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/teacher')}>Trang chủ</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/teacher/my-proposals')}>Đề xuất của tôi</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold">Chi tiết đề xuất</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg font-bold text-on-surface">Chi tiết đề xuất: {proposal.code}</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-label-md">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Yêu cầu chỉnh sửa
            </span>
          </div>
          <p className="font-body-md text-on-surface-variant mt-1">Xem thông tin chi tiết và phản hồi chỉnh sửa cho đề xuất mua sắm giáo cụ</p>
        </div>

        {/* 1. KHUNG CẢNH BÁO YÊU CẦU CHỈNH SỬA TỪ QUẢN LÝ */}
        {revisionNote && (
          <div className="bg-[#fffdf5] border border-amber-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600 flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]">edit_note</span>
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-headline-sm text-sm font-semibold text-amber-800">Nội dung yêu cầu chỉnh sửa từ Quản lý</h2>
                  <div className="flex items-center gap-2 text-amber-700/80 font-body-sm text-xs">
                    <span>Người yêu cầu: {revisionNote.actorName} {revisionNote.actorRole ? `(${revisionNote.actorRole})` : ''}</span>
                    <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                    <span>Ngày yêu cầu: {formatDateTime(revisionNote.createdAt)}</span>
                  </div>
                </div>
                <div className="bg-white border border-amber-200 rounded-lg p-3.5 text-on-surface font-body-md text-sm leading-relaxed">
                  "{revisionNote.note}"
                </div>
                <p className="font-label-sm text-xs text-amber-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Bạn có thể nhấn 'Chỉnh sửa đề xuất' ở cuối trang để cập nhật thông tin và nộp lại.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. TÓM TẮT ĐỀ XUẤT */}
        <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 shadow-sm">
          <h2 className="font-headline-sm font-bold text-on-surface mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">assignment</span> Thông tin tóm tắt đề xuất
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-4">
              <div><span className="font-caption text-on-surface-variant">Mã đề xuất</span><p className="font-headline-sm font-bold text-primary">{proposal.code}</p></div>
              <div><span className="font-caption text-on-surface-variant">Người tạo</span><p className="font-label-md text-on-surface font-medium">{proposal.creatorName}</p><p className="font-caption text-on-surface-variant">{proposal.creatorPosition}</p></div>
            </div>
            <div className="space-y-4">
              <div><span className="font-caption text-on-surface-variant">Nhóm chuyên môn</span><p className="font-body-md text-on-surface font-medium">{proposal.creatorGroupName || 'N/A'}</p></div>
              <div><span className="font-caption text-on-surface-variant">Ngày tạo</span><p className="font-body-md text-on-surface font-medium">{formatDateTime(proposal.createdAt)}</p></div>
            </div>
            <div className="space-y-4">
              <div><span className="font-caption text-on-surface-variant">Thời gian cần</span><p className="font-body-md text-on-surface font-semibold text-primary">{formatDate(proposal.requiredDate)}</p></div>
              <div><span className="font-caption text-on-surface-variant">Mức độ ưu tiên</span><div className="mt-0.5">{renderPriorityBadge(proposal.priority)}</div></div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/40 flex flex-col justify-center">
              <span className="font-caption text-primary font-semibold uppercase tracking-wider">Tổng chi phí dự kiến</span>
              <p className="font-headline-lg font-bold text-primary mt-1">{proposal.estimatedTotal?.toLocaleString('vi-VN')} ₫</p>
              <span className="font-caption text-on-surface-variant mt-1">Bao gồm {proposal.items?.length || 0} hạng mục giáo cụ</span>
            </div>
          </div>
        </section>

        {/* 3. DANH SÁCH GIÁO CỤ */}
        <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="font-headline-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">format_list_bulleted</span> Thông tin đề xuất & Danh sách giáo cụ
            </h2>
            <div className="mt-3 bg-surface-container-low/60 rounded-lg p-3.5 border border-outline-variant/30">
              <span className="font-label-md text-on-surface font-semibold">Mục đích sử dụng:</span>
              <p className="font-body-md text-on-surface-variant mt-0.5 whitespace-pre-wrap">{proposal.purpose}</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-outline-variant/60 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-label-md">
                  <th className="py-3 px-4 w-16 text-center">STT</th>
                  <th className="py-3 px-4">Tên giáo cụ & Loại</th>
                  <th className="py-3 px-4 w-28 text-center">Số lượng</th>
                  <th className="py-3 px-4 w-28 text-center">Đơn vị tính</th>
                  <th className="py-3 px-4 w-36 text-right">Đơn giá dự kiến</th>
                  <th className="py-3 px-4 w-36 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 font-body-md">
                {proposal.items?.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3.5 px-4 text-center font-numeric-data text-on-surface-variant">{index + 1}</td>
                    <td className="py-3.5 px-4"><div className="font-medium text-on-surface">{item.name}</div><div className="text-caption text-on-surface-variant">{mapCategory(item.category)}</div></td>
                    <td className="py-3.5 px-4 text-center font-numeric-data">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-center text-on-surface-variant">{item.unit}</td>
                    <td className="py-3.5 px-4 text-right font-numeric-data">{item.price?.toLocaleString('vi-VN')} ₫</td>
                    <td className="py-3.5 px-4 text-right font-numeric-data font-semibold text-on-surface">{((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} ₫</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface-container-low font-semibold text-on-surface border-t-2 border-outline-variant">
                  <td className="py-3.5 px-4 text-right" colSpan="4">Tổng cộng ({proposal.items?.length || 0} loại giáo cụ, {totalItemsCount} sản phẩm):</td>
                  <td className="py-3.5 px-4 text-right font-headline-sm text-primary" colSpan="2">{proposal.estimatedTotal?.toLocaleString('vi-VN')} ₫</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* FILE ĐÍNH KÈM */}
          <div>
            <h3 className="font-label-md text-on-surface font-semibold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-outline">attach_file</span> Tệp đính kèm ({proposal.attachments?.length || 0})
            </h3>
            {proposal.attachments && proposal.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {proposal.attachments.map((file, index) => (
                  <div key={file.id || index} className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[22px]">{getFileIcon(file.fileName)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-label-md text-on-surface truncate" title={file.fileName}>{file.fileName}</p>
                        <p className="text-caption text-on-surface-variant">Tài liệu đính kèm</p>
                      </div>
                    </div>
                    {file.fileUrl && (
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-primary hover:bg-surface-container transition-colors flex-shrink-0" title="Tải xuống/Xem">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-body-sm text-on-surface-variant bg-surface-container-lowest border border-outline-variant/60 border-dashed rounded-xl p-4 text-center">Không có tệp đính kèm nào.</div>
            )}
          </div>
        </section>

        {/* LỊCH SỬ XỬ LÝ (Mới nhất ở trên cùng) */}
        <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-6 shadow-sm">
          <h2 className="font-headline-sm font-bold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">history</span> Lịch sử xử lý
          </h2>
          
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/60">
            {proposal.histories && proposal.histories.length > 0 ? (
              [...proposal.histories].reverse().map((history, index) => {
                const style = getHistoryStyle(history.actionLabel);
                return (
                  <div key={history.id || index} className="relative flex items-start gap-4">
                    <span className={`absolute -left-[30px] mt-1 w-3.5 h-3.5 rounded-full ${style.dot} ring-4 ${style.ring}`}></span>
                    
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded font-label-sm font-semibold ${style.badgeBg} ${style.badgeText}`}>
                            {history.actionLabel}
                          </span>
                          <span className="font-label-md text-on-surface font-semibold">
                            {history.actorName} {history.actorRole ? `(${history.actorRole})` : ''}
                          </span>
                        </div>
                        <span className="font-caption text-on-surface-variant">
                          {formatDateTime(history.createdAt)}
                        </span>
                      </div>
                      
                      {history.note && (
                        <div className="font-body-sm text-on-surface bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 mt-1 whitespace-pre-wrap">
                          <strong>Ghi chú:</strong> {history.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-body-sm text-on-surface-variant">Chưa có lịch sử xử lý nào.</div>
            )}
          </div>
        </section>

      </div>

      {/* FOOTER ACTION BAR */}
      <footer className="fixed bottom-0 right-0 w-[calc(100%-16rem)] h-18 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/60 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] py-3.5 px-8 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-on-surface-variant font-caption text-caption">
          <span className="material-symbols-outlined text-[16px] text-amber-600">notification_important</span>
          <span>Đề xuất đang ở trạng thái <strong>Yêu cầu chỉnh sửa</strong>. Hãy cập nhật các mục cần thiết trước khi gửi lại.</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/teacher/my-proposals')}
            className="px-5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low font-label-md flex items-center gap-2 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại danh sách
          </button>
          
          <button 
            onClick={() => navigate(`/teacher/edit-proposal/${proposal.id}`)}
            className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-container font-label-md flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span> Chỉnh sửa đề xuất
          </button>
        </div>
      </footer>
    </div>
  );
}