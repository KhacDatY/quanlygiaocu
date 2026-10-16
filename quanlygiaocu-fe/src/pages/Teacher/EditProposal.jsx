// src/pages/Teacher/EditProposal.jsx
import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { AuthContext } from '../../contexts/AuthContext';

export default function EditProposal() {
  const { id } = useParams(); 
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [originalProposal, setOriginalProposal] = useState(null);

  const [formData, setFormData] = useState({
    purpose: '',
    requiredDate: '',
    priority: 'HIGH',
    editNote: '', 
    items: [],
    attachments: []
  });

  const [validationErrors, setValidationErrors] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false); // Modal Hủy
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const data = await apiClient.get(`/proposals/${id}`);
        setOriginalProposal(data);
        
        setFormData({
          purpose: data.purpose || '',
          requiredDate: data.requiredDate || '',
          priority: data.priority || 'HIGH',
          editNote: '',
          items: data.items ? data.items.map(item => ({
            name: item.name || '',
            category: item.category || 'OTHER',
            quantity: item.quantity || 1,
            unit: item.unit || 'Cái',
            price: item.price || 0
          })) : [],
          attachments: data.attachments || [] 
        });
      } catch (error) {
        alert(error.message || 'Không thể tải chi tiết đề xuất');
        navigate('/teacher/my-proposals');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProposal();
  }, [id, navigate]);

  const getRevisionNote = () => {
    if (!originalProposal || !originalProposal.histories) return null;
    const revisions = originalProposal.histories.filter(h => h.actionLabel.includes('Yêu cầu chỉnh sửa'));
    if (revisions.length === 0) return null;
    return revisions[revisions.length - 1]; 
  };

  const revisionNote = getRevisionNote();

  const estimatedTotal = formData.items.reduce((total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);

  const getAvatarInitials = (fullName) => {
    if (!fullName) return 'GV';
    const words = fullName.trim().split(/\s+/);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { name: '', category: 'OTHER', quantity: 1, unit: 'Cái', price: 0 }] });
  
  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    setValidationErrors(validationErrors.filter(e => e.index !== index));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.requiredDate) errors.push({ id: 'date', msg: 'Vui lòng chọn thời gian cần hàng' });
    if (formData.purpose.trim().length < 30) errors.push({ id: 'purpose', msg: `Căn cứ đề xuất: Tối thiểu 30 ký tự` });
    if (formData.editNote.trim().length === 0) errors.push({ id: 'editNote', msg: 'Vui lòng nhập ghi chú cập nhật gửi quản lý' });

    formData.items.forEach((item, index) => {
      if (!item.name.trim()) errors.push({ id: `name_${index}`, index, msg: `Dòng ${index + 1}: Vui lòng nhập tên giáo cụ` });
      if (item.quantity <= 0) errors.push({ id: `qty_${index}`, index, msg: `Dòng ${index + 1}: Số lượng phải > 0` });
      if (item.price <= 0) errors.push({ id: `price_${index}`, index, msg: `Dòng ${index + 1}: Đơn giá phải > 0 ₫` });
    });
    return errors;
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (errs.length > 0) {
      setValidationErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
    } else {
      setValidationErrors([]);
      setShowConfirmModal(true); 
    }
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      await apiClient.put(`/proposals/${id}`, formData);
      setShowConfirmModal(false);
      setShowSuccessToast(true);
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra khi cập nhật đề xuất!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setShowCancelModal(false);
    navigate(`/teacher/need-edit-proposal-detail/${id}`);
  };

  const hasError = (idPrefix) => validationErrors.some(err => err.id.startsWith(idPrefix));
  const hasItemError = (index) => validationErrors.some(err => err.index === index);

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-64px)] text-primary"><span className="material-symbols-outlined animate-spin text-4xl">sync</span></div>;
  }

  return (
    <>
      {/* Thông báo lỗi Validation */}
      {validationErrors.length > 0 && !showSuccessToast && (
        <div className="fixed top-20 right-8 z-[60] flex items-start gap-3 bg-surface-container-lowest border-2 border-error text-on-surface px-4 py-3.5 rounded-xl shadow-lg max-w-md">
          <div className="w-9 h-9 rounded-full bg-error-container text-error flex items-center justify-center shrink-0 mt-0.5"><span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between"><h4 className="font-semibold text-error">Không thể gửi đề xuất</h4><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error text-white uppercase">{validationErrors.length} Lỗi</span></div>
            <p className="text-body-sm text-on-surface-variant mt-0.5">Vui lòng kiểm tra lại các trường báo đỏ và thử lại.</p>
          </div>
          <button type="button" onClick={() => setValidationErrors([])} className="text-outline hover:text-error p-1"><span className="material-symbols-outlined text-[18px]">close</span></button>
        </div>
      )}

      {/* TOAST THÔNG BÁO CẬP NHẬT THÀNH CÔNG (Giống image_b97927.png) */}
      {showSuccessToast && (
        <div className="fixed top-20 right-6 z-[60] flex flex-col gap-3 w-full max-w-[420px]">
          <div className="pointer-events-auto bg-surface-container-lowest border border-emerald-200 rounded-xl p-4 shadow-lg flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-label-md text-on-surface font-bold">Gửi đề xuất thành công!</span>
                <span className="text-[11px] text-outline">Vừa xong</span>
              </div>
              <p className="text-body-sm text-on-surface-variant leading-snug mb-3">
                Đề xuất mã <strong className="text-primary font-mono">{originalProposal?.code}</strong> đã được chuyển tới Quản lý chuyên môn duyệt (SLA 48h).
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate(`/teacher/proposal-detail/${id}`)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors"
                >
                  Xem chi tiết hồ sơ
                </button>
                <button 
                  onClick={() => { setShowSuccessToast(false); navigate('/teacher/my-proposals'); }}
                  className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant rounded text-xs font-medium transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
            <button onClick={() => { setShowSuccessToast(false); navigate('/teacher/my-proposals'); }} className="text-outline hover:text-on-surface p-1">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      <form className="relative min-h-screen pb-28 bg-surface">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-8 py-6">
          
          <section className="mb-6">
            <nav className="flex items-center gap-2 text-caption font-caption text-outline mb-2">
              <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/teacher')}>Trang chủ</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/teacher/my-proposals')}>Đề xuất của tôi</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="hover:text-primary cursor-pointer" onClick={() => navigate(`/teacher/need-edit-proposal-detail/${id}`)}>Cần chỉnh sửa</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-semibold">Chỉnh sửa</span>
            </nav>
            <div className="flex items-center gap-3">
              <h1 className="font-headline-lg font-bold text-on-surface tracking-tight">Chỉnh sửa đề xuất: {originalProposal?.code}</h1>
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">Yêu cầu chỉnh sửa</span>
            </div>
          </section>

          {/* KHUNG CẢNH BÁO YÊU CẦU CHỈNH SỬA TỪ QUẢN LÝ */}
          {revisionNote && (
            <div className="bg-[#fffdf5] border border-amber-200 rounded-xl p-5 shadow-sm mb-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 flex-shrink-0">
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
                  <div className="bg-white border border-amber-200/80 rounded-lg p-3.5 text-on-surface font-body-md text-sm leading-relaxed whitespace-pre-wrap">
                    "{revisionNote.note}"
                  </div>
                  <p className="font-label-sm text-xs text-amber-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">info</span> Hãy sửa các trường thông tin bên dưới và điền "Ghi chú cập nhật" trước khi nộp lại.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* THÔNG TIN CHUNG */}
            <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/60 bg-surface-bright flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary"><span className="material-symbols-outlined text-[20px]">description</span></div>
                <h2 className="font-headline-sm font-semibold">Thông-tin chung</h2>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase">
                        {getAvatarInitials(user?.fullName)}
                      </div>
                      <div>
                        <span className="text-caption text-outline block mb-0.5">Người tạo đề xuất</span>
                        <span className="text-body-md font-semibold block leading-tight">{user?.fullName || 'Đang cập nhật'}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px]" title="Thông tin cố định">lock</span>
                  </div>
                  
                  <div className="p-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col justify-center">
                      <span className="text-caption text-outline block mb-1.5">Nhóm chuyên môn</span>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-surface-container-high text-primary">
                          {user?.groupName || 'Đang cập nhật'}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px]" title="Thông tin cố định">lock</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={`block font-label-md mb-1.5 flex items-center justify-between ${hasError('date') ? 'text-error font-semibold' : 'text-on-surface'}`}>
                      <span>Thời gian cần hàng <span className="text-error">*</span></span>
                    </label>
                    <input type="date" value={formData.requiredDate} onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })} className={`w-full px-4 py-2 rounded-lg outline-none ${hasError('date') ? 'bg-error-container/20 border-2 border-error text-error' : 'bg-surface-container-lowest border border-outline-variant focus:border-primary'}`} />
                  </div>

                  <div>
                    <label className="block font-label-md text-on-surface mb-1.5">Mức độ ưu tiên <span className="text-error">*</span></label>
                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary outline-none">
                      <option value="HIGH">Ưu tiên cao</option><option value="MEDIUM">Trung bình</option><option value="LOW">Thấp</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`font-label-md flex items-center justify-between mb-1.5 ${hasError('purpose') ? 'text-error font-semibold' : 'text-on-surface'}`}>
                    <span>Mục đích sử dụng & Căn cứ đề xuất <span className="text-error">*</span></span>
                  </label>
                  <textarea rows="3" maxLength={1000} value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} className={`w-full p-3 rounded-lg outline-none resize-none leading-relaxed ${hasError('purpose') ? 'bg-error-container/20 border-2 border-error font-medium' : 'bg-surface-container-lowest border border-outline-variant focus:border-primary'}`}></textarea>
                </div>

                <div>
                  <label className={`font-label-md flex items-center justify-between mb-1.5 ${hasError('editNote') ? 'text-error font-semibold' : 'text-on-surface'}`}>
                    <span>Ghi chú phản hồi cho Quản lý <span className="text-error">*</span></span>
                  </label>
                  <textarea rows="2" placeholder="VD: Em đã điều chỉnh lại số lượng bút và gửi kèm báo giá đối chiếu..." value={formData.editNote} onChange={(e) => setFormData({ ...formData, editNote: e.target.value })} className={`w-full p-3 rounded-lg outline-none resize-none leading-relaxed ${hasError('editNote') ? 'bg-error-container/20 border-2 border-error font-medium' : 'bg-surface-container-lowest border border-outline-variant focus:border-primary'}`}></textarea>
                  <p className="text-caption text-on-surface-variant mt-1">Trường này giúp quản lý biết bạn đã sửa đổi phần nào để duyệt nhanh hơn.</p>
                </div>

              </div>
            </div>

            {/* DANH SÁCH GIÁO CỤ */}
            <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/60 bg-surface-bright flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${validationErrors.some(e => e.id.startsWith('qty') || e.id.startsWith('price')) ? 'bg-error-container text-error' : 'bg-surface-container text-primary'}`}>
                    <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                  </div>
                  <h2 className="font-headline-sm font-semibold">Danh sách giáo cụ cần mua</h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="border border-outline-variant rounded-lg overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-surface-bright border-b border-outline-variant text-[11px] font-label-md uppercase text-outline">
                        <th className="py-2.5 px-3 w-12 text-center">STT</th>
                        <th className="py-2.5 px-3 min-w-[150px]">Loại *</th>
                        <th className="py-2.5 px-4 min-w-[200px]">Tên *</th>
                        <th className="py-2.5 px-3 w-24 text-center">SL *</th>
                        <th className="py-2.5 px-3 w-24 text-center">ĐVT *</th>
                        <th className="py-2.5 px-4 w-32 text-right">Đơn giá (₫) *</th>
                        <th className="py-2.5 px-4 w-36 text-right">Thành tiền (₫)</th>
                        <th className="py-2.5 px-3 w-14 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/60">
                      {formData.items.map((item, index) => {
                        const isErrorRow = hasItemError(index);
                        return (
                          <tr key={index} className={`transition-colors ${isErrorRow ? 'bg-error-container/5' : 'hover:bg-surface-bright'}`}>
                            <td className="py-3 px-3 text-center text-outline font-numeric-data">{index + 1}</td>
                            <td className="py-3 px-3">
                              <select value={item.category} onChange={(e) => handleItemChange(index, 'category', e.target.value)} className="w-full py-1.5 px-2 border border-outline-variant rounded-lg focus:border-primary outline-none">
                                <option value="PEN">Bút</option><option value="PAPER">Giấy</option><option value="FLASHCARD">Thẻ từ vựng</option><option value="BOOK">Sách</option><option value="AUDIO_DEVICE">Thiết bị âm thanh</option><option value="OTHER">Khác</option>
                              </select>
                            </td>
                            <td className="py-3 px-4"><input type="text" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} className={`w-full py-1.5 px-3 border rounded-lg outline-none ${validationErrors.some(e => e.id === `name_${index}`) ? 'border-error bg-error-container/20' : 'border-outline-variant focus:border-primary'}`} /></td>
                            <td className="py-3 px-3 text-center"><input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className={`w-full py-1.5 px-2 text-center rounded-lg border outline-none font-numeric-data ${validationErrors.some(e => e.id === `qty_${index}`) ? 'border-error bg-error-container/20 text-error font-bold' : 'border-outline-variant focus:border-primary'}`} /></td>
                            <td className="py-3 px-3 text-center"><input type="text" value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)} className="w-full py-1.5 px-2 text-center border border-outline-variant rounded-lg focus:border-primary outline-none" /></td>
                            <td className="py-3 px-4 text-right"><input type="number" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} className={`w-full py-1.5 px-2 text-right rounded-lg border outline-none font-numeric-data ${validationErrors.some(e => e.id === `price_${index}`) ? 'border-error bg-error-container/20 text-error font-bold' : 'border-outline-variant focus:border-primary'}`} /></td>
                            <td className="py-3 px-4 text-right font-numeric-data font-semibold text-primary">{((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} ₫</td>
                            <td className="py-3 px-3 text-center"><button type="button" onClick={() => removeItem(index)} className="p-1 rounded text-outline hover:text-error hover:bg-error-container/30 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button type="button" onClick={addItem} className="w-full py-2.5 px-4 border-2 border-dashed border-primary/20 hover:border-primary text-primary hover:bg-surface-container-low rounded-lg font-label-md flex items-center justify-center gap-2 transition-colors">
                  <span className="material-symbols-outlined">add_circle</span> Thêm giáo cụ
                </button>

                <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0"><span className="material-symbols-outlined text-[24px]">calculate</span></div>
                    <div><span className="font-label-md font-semibold text-on-surface block">Tổng chi phí dự kiến</span></div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-numeric-data text-primary">{estimatedTotal.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant/80 py-3.5 px-8 shadow-lg flex items-center justify-between backdrop-blur-md left-64">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-body-sm font-body-sm text-outline">
            <span className="material-symbols-outlined text-base text-secondary">check</span>
            <span>Dữ liệu chỉnh sửa sẽ được lưu khi gửi lại</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setShowCancelModal(true)} className="px-5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-bright font-label-md transition-colors text-on-surface">
            Hủy thay đổi
          </button>
          <button type="button" onClick={handlePreSubmit} disabled={submitting} className={`px-6 py-2.5 rounded-lg text-white font-label-md flex items-center gap-2 shadow-sm ${submitting ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-container'}`}>
            <span className={`material-symbols-outlined text-[18px] ${submitting ? 'animate-spin' : ''}`}>{submitting ? 'sync' : 'send'}</span>
            <span>{submitting ? 'Đang gửi...' : 'Gửi lại đề xuất'}</span>
          </button>
        </div>
      </div>

      {/* MODAL XÁC NHẬN GỬI LẠI ĐỀ XUẤT (Giống HTML) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="relative w-full max-w-[540px] bg-surface-container-lowest rounded-2xl border border-outline-variant/80 shadow-2xl p-6 overflow-hidden flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-surface-container text-primary border border-surface-container-high flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">send</span>
                </div>
                <div>
                  <h2 className="text-headline-md font-bold text-on-surface">Xác nhận gửi lại đề xuất</h2>
                  <p className="text-body-sm text-on-surface-variant">Cập nhật hồ sơ đề xuất mua sắm theo yêu cầu phê duyệt</p>
                </div>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="text-outline hover:text-on-surface hover:bg-surface-container-low p-1.5 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-body-md text-on-surface leading-relaxed">
                Bạn có chắc chắn muốn gửi lại đề xuất <strong className="font-semibold text-primary font-mono">{originalProposal?.code}</strong> sau khi đã hoàn tất cập nhật theo yêu cầu không?
              </p>
              
              <div className="bg-surface-container-low/70 border border-outline-variant/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-body-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-caption text-outline uppercase">Mã đề xuất:</span>
                    <span className="font-mono font-bold text-primary text-base">{originalProposal?.code}</span>
                  </div>
                </div>
                <div className="border-t border-outline-variant/40"></div>
                <div className="flex items-start gap-2.5 text-body-sm">
                  <span className="material-symbols-outlined text-base text-primary mt-0.5">category</span>
                  <div className="flex-1">
                    <span className="font-medium text-on-surface">{formData.items.length} loại giáo cụ</span>
                  </div>
                </div>
                <div className="border-t border-outline-variant/40"></div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-label-md text-on-surface">Tổng chi phí dự kiến mới:</span>
                  <span className="font-bold text-headline-sm text-primary font-numeric-data">{estimatedTotal.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
              
              <div className="bg-surface-container-low border border-surface-container-high rounded-lg p-3.5 flex items-start gap-3 text-body-sm text-primary">
                <span className="material-symbols-outlined text-xl text-primary flex-shrink-0 mt-0.5">info</span>
                <p className="leading-snug text-on-surface">
                  Đề xuất sẽ quay về trạng thái <strong className="font-semibold text-primary">"Chờ duyệt đề xuất"</strong> và Quản lý chuyên môn sẽ nhận được thông báo để thẩm định lại hồ sơ.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/50">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2.5 border border-outline-variant text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface rounded-lg font-label-md transition-colors">
                Hủy
              </button>
              <button onClick={confirmSubmit} disabled={submitting} className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-md flex items-center gap-2 shadow-sm transition-all">
                <span className="material-symbols-outlined text-lg">send</span>
                <span>{submitting ? 'Đang gửi...' : 'Xác nhận gửi lại'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HỦY CHỈNH SỬA (Giống image_b978e8.png) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="relative w-full max-w-[480px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 overflow-hidden flex flex-col gap-4">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[28px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-slate-800">Hủy chỉnh sửa</h2>
                  <p className="text-xs font-medium text-slate-500">Đề xuất mua sắm {originalProposal?.code}</p>
                </div>
              </div>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Các thay đổi chưa lưu sẽ bị mất. Bạn có chắc chắn muốn hủy bỏ thao tác chỉnh sửa này không?
            </p>
            
            <div className="bg-[#f3f6fc] border border-[#e1e6f4] rounded-xl p-4 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#0a3d91] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[14px]">info</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Hồ sơ đề xuất <strong>{originalProposal?.code}</strong> sẽ giữ nguyên trạng thái <strong className="text-amber-700">'Cần chỉnh sửa'</strong> hiện tại và các thông tin đã cập nhật trong phiên làm việc này sẽ không được lưu vào hệ thống.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-3 pt-3">
              <button 
                onClick={() => setShowCancelModal(false)} 
                className="flex-1 py-2.5 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                Tiếp tục chỉnh sửa
              </button>
              <button 
                onClick={handleCancelEdit} 
                className="flex-1 py-2.5 bg-[#b91c1c] hover:bg-red-800 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}