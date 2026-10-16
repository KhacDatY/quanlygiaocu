import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { AuthContext } from '../../contexts/AuthContext';

export default function CreateProposal() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // States quản lý Form và UI
  const [formData, setFormData] = useState({
    purpose: '',
    requiredDate: '',
    priority: 'HIGH',
    items: [{ name: '', category: 'PEN', quantity: 1, unit: 'Cây', price: 0 }],
    attachments: []
  });

  const [validationErrors, setValidationErrors] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successCode, setSuccessCode] = useState('');
  const [previewCode, setPreviewCode] = useState('Đang tải...');

  // Lấy mã đề xuất preview từ BE khi load trang
  useEffect(() => {
    const fetchNextCode = async () => {
      try {
        const code = await apiClient.get('/proposals/next-code');
        setPreviewCode(code);
      } catch (error) {
        console.error("Lỗi lấy mã đề xuất:", error);
        setPreviewCode('DX-XXXX-XXXX'); // Fallback nếu lỗi
      }
    };
    fetchNextCode();
  }, []);

  // Hàm tính tổng tiền tự động
  const estimatedTotal = formData.items.reduce(
    (total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  // Lấy chữ cái đầu (Avatar)
  const getAvatarInitials = (fullName) => {
    if (!fullName) return 'GV';
    const words = fullName.trim().split(/\s+/);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Xử lý thay đổi dữ liệu bảng giáo cụ
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  // Thêm 1 dòng giáo cụ mới
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', category: 'OTHER', quantity: 1, unit: 'Cái', price: 0 }]
    });
  };

  // Xóa 1 dòng giáo cụ
  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    setValidationErrors(validationErrors.filter(e => e.index !== index));
  };

  // Validate Form
  const validateForm = () => {
    const errors = [];
    if (formData.requiredDate) {
      const today = new Date();
      const reqDate = new Date(formData.requiredDate);
      const diffTime = reqDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays < 3) {
        errors.push({ id: 'date', msg: 'Thời gian cần hàng: Phải sau ≥ 3 ngày làm việc' });
      }
    } else {
      errors.push({ id: 'date', msg: 'Vui lòng chọn thời gian cần hàng' });
    }

    if (formData.purpose.trim().length < 30) {
      errors.push({ id: 'purpose', msg: `Căn cứ đề xuất: Tối thiểu 30 ký tự (hiện có ${formData.purpose.trim().length})` });
    }

    formData.items.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push({ id: `qty_${index}`, index, msg: `Dòng ${index + 1}: Số lượng phải là số nguyên > 0` });
      }
      if (item.price <= 0) {
        errors.push({ id: `price_${index}`, index, msg: `Dòng ${index + 1}: Đơn giá dự kiến phải > 0 ₫` });
      }
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
    setLoading(true);
    try {
      const response = await apiClient.post('/proposals', formData);
      setSuccessCode(response.code || previewCode);
      setShowConfirmModal(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        navigate('/teacher/my-proposals');
      }, 4500);
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra khi tạo đề xuất!');
    } finally {
      setLoading(false);
    }
  };

  const hasError = (idPrefix) => validationErrors.some(err => err.id.startsWith(idPrefix));
  const hasItemError = (index) => validationErrors.some(err => err.index === index);

  const renderPriorityBadge = () => {
    switch (formData.priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-error-container text-on-error-container">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>local_fire_department</span>
            Ưu tiên cao: Xử lý phê duyệt trong 48 giờ
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-yellow-100 text-yellow-800">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            Ưu tiên trung bình: Xử lý trong vòng 7 ngày
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">update</span>
            Ưu tiên thấp: Xử lý trong vòng 30 ngày
          </span>
        );
      default: return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes progressCountdown {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        .animate-progress-5s {
          animation: progressCountdown 5s linear forwards;
        }
      `}</style>

      {validationErrors.length > 0 && !showSuccessToast && (
        <div className="fixed top-20 right-8 z-[60] flex items-start gap-3 bg-surface-container-lowest border-2 border-error text-on-surface px-4 py-3.5 rounded-xl shadow-lg max-w-md transition-all">
          <div className="w-9 h-9 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px] text-error">error</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-body-md font-semibold text-error">Không thể gửi đề xuất</h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error text-white uppercase">{validationErrors.length} Lỗi</span>
            </div>
            <p className="text-body-sm text-on-surface-variant mt-0.5 leading-snug">Có {validationErrors.length} lỗi thông tin cần khắc phục trước khi gửi phê duyệt.</p>
          </div>
          <button type="button" onClick={() => setValidationErrors([])} className="text-outline hover:text-error transition-colors p-1">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {showSuccessToast && (
        <div aria-live="assertive" className="fixed top-20 right-8 z-[60] w-[420px] bg-surface-container-lowest border border-emerald-300 rounded-xl shadow-xl overflow-hidden transition-all duration-300 ease-out transform translate-y-0" id="floating-toast">
          <div className="p-4 flex items-start gap-3.5 bg-gradient-to-b from-emerald-50/80 to-surface-container-lowest">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
              <span className="material-symbols-outlined text-emerald-600 text-[24px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-label-md font-headline-sm text-emerald-950 font-bold">Gửi đề xuất thành công</h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Chờ duyệt</span>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                Mã đề xuất: <strong className="text-on-surface font-semibold font-mono tracking-tight text-primary">{successCode}</strong>. Đã chuyển sang trạng thái chờ Quản lý chuyên môn xét duyệt.
              </p>
            </div>
            <button aria-label="Đóng thông báo" className="text-outline hover:text-on-surface p-1 rounded-md transition-colors" onClick={() => setShowSuccessToast(false)}>
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="w-full h-1 bg-emerald-100 overflow-hidden">
            <div className="h-full bg-emerald-600 animate-progress-5s"></div>
          </div>
        </div>
      )}

      <form className="relative min-h-screen">
        <div className="w-full max-w-[1240px] mx-auto px-6 py-6 pb-28">
          
          <section className="mb-6">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-caption font-caption text-outline mb-1.5">
              <span className="hover:text-primary cursor-pointer">Hệ thống giáo cụ</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="hover:text-primary cursor-pointer">Đề xuất của tôi</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-semibold">Tạo đề xuất mới</span>
            </nav>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface tracking-tight">Tạo đề xuất mua sắm giáo cụ</h1>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">Khởi tạo phiếu yêu cầu mua sắm giáo cụ phục vụ công tác giảng dạy kỳ học mới.</p>
              </div>
            </div>
          </section>

          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-error-container/30 border-2 border-error rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-error-container flex items-center justify-center text-error shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[24px]">report</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-headline-sm font-semibold text-error">Vui lòng kiểm tra lại các trường thông tin bắt buộc và dữ liệu không hợp lệ</h3>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-error text-white">{validationErrors.length} lỗi cần sửa</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant mt-1">Biểu mẫu chưa thể gửi đi do phát hiện lỗi định dạng.</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {validationErrors.map((err, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-surface-container-lowest border border-error text-error shadow-2xs">
                        <span className="material-symbols-outlined text-[14px]">error</span> {err.msg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/60 bg-surface-bright flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">description</span>
                </div>
                <div>
                  <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">Thông tin chung</h2>
                  <p className="text-caption font-caption text-on-surface-variant">Thông tin cơ bản về đợt đề xuất và căn cứ triển khai công tác chuyên môn</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase">
                        {getAvatarInitials(user?.fullName)}
                      </div>
                      <div>
                        <span className="text-caption font-caption text-outline block mb-0.5">Người tạo đề xuất</span>
                        <span className="text-body-md font-label-md text-on-surface font-semibold block leading-tight">{user?.fullName || 'Đang cập nhật'}</span>
                        <span className="text-caption font-caption text-on-surface-variant block mt-0.5">
                          {user?.position || 'Đang cập nhật'} {user?.groupName ? `- ${user.groupName}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px]" title="Thông tin cố định">lock</span>
                  </div>
                  
                  <div className="p-3.5 bg-surface-container-low border border-outline-variant/60 rounded-xl flex items-center justify-between">
                    <div className="flex flex-col justify-center">
                      <span className="text-caption font-caption text-outline block mb-1.5">Nhóm chuyên môn & Đơn vị</span>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-surface-container-high text-primary">
                          {user?.groupName || 'Đang cập nhật'}
                        </span>
                        <span className="text-body-sm font-body-sm text-on-surface-variant">Cơ sở: Hà Nội - Cầu Giấy</span>
                      </div>
                      <span className="text-caption font-caption text-outline font-mono">Tài khoản: {user?.username}</span>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[18px]" title="Thông tin cố định">lock</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={`block text-label-md font-label-md mb-1.5 flex items-center justify-between ${hasError('date') ? 'text-error font-semibold' : 'text-on-surface'}`}>
                      <span>Thời gian cần hàng <span className="text-error">*</span></span>
                      {hasError('date') && <span className="text-caption font-semibold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> Lỗi ngày nhận</span>}
                    </label>
                    <div className="relative">
                      <span className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${hasError('date') ? 'text-error' : 'text-primary'}`}>
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                      </span>
                      <input 
                        type="date" 
                        value={formData.requiredDate}
                        onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                        className={`w-full pl-9 pr-4 py-2 text-body-sm font-body-sm rounded-lg outline-none ${hasError('date') ? 'bg-error-container/20 border-2 border-error focus:border-error focus:ring-1 focus:ring-error text-error font-semibold' : 'bg-surface-container-lowest border border-outline-variant focus:border-primary text-on-surface'}`} 
                      />
                    </div>
                    <p className={`text-caption font-caption mt-1.5 flex items-center gap-1 ${hasError('date') ? 'text-error font-semibold' : 'text-outline'}`}>
                      {hasError('date') ? <span className="material-symbols-outlined text-[14px]">cancel</span> : <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>}
                      <span>{hasError('date') ? 'Thời gian cần hàng phải sau ngày hiện tại tối thiểu 3 ngày làm việc.' : '≥ hôm nay, định dạng DD/MM/YYYY'}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-label-md font-label-md text-on-surface mb-1.5">
                      Mức độ ưu tiên <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <select 
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full pl-3 pr-10 py-2 text-body-sm font-label-md bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-on-surface appearance-none outline-none"
                      >
                        <option value="HIGH">Ưu tiên cao (Khẩn cấp phục vụ kỳ học mới)</option>
                        <option value="MEDIUM">Ưu tiên trung bình (Theo kế hoạch tháng)</option>
                        <option value="LOW">Ưu tiên thấp (Dự phòng)</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-outline">
                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {renderPriorityBadge()}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-label-md font-label-md flex items-center gap-1 ${hasError('purpose') ? 'text-error font-semibold' : 'text-on-surface'}`}>
                      <span>Mục đích sử dụng & Căn cứ đề xuất <span className="text-error">*</span></span>
                    </label>
                    <span className={`text-caption font-bold rounded px-2 py-0.5 ${hasError('purpose') ? 'text-error bg-error-container/40' : 'text-outline'}`}>
                      {formData.purpose.trim().length}/1000 ký tự {hasError('purpose') && '(Chưa đạt tối thiểu 30)'}
                    </span>
                  </div>
                  <div className="relative">
                    <textarea 
                      rows="3" 
                      maxLength={1000}
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="Nêu rõ lý do cần mua sắm giáo cụ..." 
                      className={`w-full p-3 text-body-sm font-body-sm rounded-lg outline-none resize-none leading-relaxed ${hasError('purpose') ? 'bg-error-container/20 border-2 border-error focus:border-error focus:ring-1 focus:ring-error text-on-surface font-medium' : 'bg-surface-container-lowest border border-outline-variant focus:border-primary'}`}
                    ></textarea>
                    {hasError('purpose') && <span className="absolute top-3 right-3 text-error pointer-events-none"><span className="material-symbols-outlined text-[20px]">error</span></span>}
                  </div>
                  {hasError('purpose') ? (
                    <p className="text-caption font-caption text-error font-semibold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">cancel</span> Vui lòng nhập tối thiểu 30 ký tự giải trình rõ mục đích sử dụng.
                    </p>
                  ) : (
                    <p className="text-caption font-caption text-on-surface-variant mt-1">Cung cấp lý do cụ thể giúp Ban Giám đốc và Phòng Tài chính thẩm định nhanh chóng.</p>
                  )}
                </div>

                <div>
                  <label className="block text-label-md font-label-md text-on-surface mb-1.5">
                    Tài liệu & Kế hoạch đính kèm
                  </label>
                  <div className="border-2 border-dashed border-outline-variant hover:border-primary/60 rounded-xl p-5 text-center bg-surface-bright transition-colors cursor-pointer group">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high group-hover:bg-surface-container flex items-center justify-center text-primary mb-2 transition-colors">
                        <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                      </div>
                      <div className="flex items-center gap-1 text-body-sm font-body-sm text-on-surface">
                        <span className="font-semibold text-primary group-hover:underline">Bấm để tải tệp lên</span>
                        <span>hoặc kéo và thả tại đây</span>
                      </div>
                      <p className="text-caption font-caption text-outline mt-0.5">Hỗ trợ PDF, DOCX, XLSX, PNG, JPG (Dung lượng tối đa 10MB/tệp)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CHI TIẾT GIÁO CỤ */}
            <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/60 bg-surface-bright flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${validationErrors.some(e => e.id.startsWith('qty') || e.id.startsWith('price')) ? 'bg-error-container text-error' : 'bg-surface-container text-primary'}`}>
                    <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                  </div>
                  <div>
                    <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">Danh sách giáo cụ cần mua</h2>
                  </div>
                </div>
                {validationErrors.some(e => e.id.startsWith('qty') || e.id.startsWith('price')) && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-error text-white shadow-xs">
                      <span className="material-symbols-outlined text-[15px]">error</span>Phát hiện lỗi dữ liệu (Bảng danh sách)
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div className="border border-outline-variant rounded-lg overflow-x-auto custom-scroll">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-surface-bright border-b border-outline-variant text-[11px] font-label-md uppercase tracking-wider text-outline">
                        <th className="py-2.5 px-3 font-semibold w-12 text-center">STT</th>
                        <th className="py-2.5 px-3 font-semibold min-w-[150px]">Loại giáo cụ *</th>
                        <th className="py-2.5 px-4 font-semibold min-w-[200px]">Tên giáo cụ *</th>
                        <th className="py-2.5 px-3 font-semibold w-24 text-center">SL *</th>
                        <th className="py-2.5 px-3 font-semibold w-24 text-center">ĐVT *</th>
                        <th className="py-2.5 px-4 font-semibold w-32 text-right">Đơn giá (₫) *</th>
                        <th className="py-2.5 px-4 font-semibold w-36 text-right">Thành tiền (₫)</th>
                        <th className="py-2.5 px-3 font-semibold w-14 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/60 text-body-sm font-body-sm text-on-surface bg-surface-container-lowest">
                      {formData.items.map((item, index) => {
                        const isErrorRow = hasItemError(index);
                        const isQtyErr = validationErrors.some(e => e.id === `qty_${index}`);
                        const isPriceErr = validationErrors.some(e => e.id === `price_${index}`);

                        return (
                          <tr key={index} className={`transition-colors ${isErrorRow ? 'bg-error-container/5 hover:bg-error-container/10' : 'hover:bg-surface-bright'}`}>
                            <td className="py-3 px-3 text-center text-outline font-numeric-data">{index + 1}</td>
                            <td className="py-3 px-3">
                              <select 
                                value={item.category}
                                onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                                className="w-full py-1.5 px-2 text-body-sm font-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary outline-none"
                              >
                                <option value="PEN">Bút</option>
                                <option value="PAPER">Giấy</option>
                                <option value="FLASHCARD">Thẻ từ vựng</option>
                                <option value="BOOK">Sách</option>
                                <option value="AUDIO_DEVICE">Thiết bị âm thanh</option>
                                <option value="OTHER">Giáo cụ khác</option>
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <input 
                                type="text" 
                                value={item.name}
                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                className="w-full py-1.5 px-3 text-body-sm font-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary outline-none" 
                                placeholder="Nhập tên giáo cụ..." 
                              />
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex flex-col items-center">
                                <input 
                                  type="number" 
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                  className={`w-20 py-1.5 px-2 text-center rounded-lg text-body-sm font-numeric-data outline-none ${isQtyErr ? 'border-2 border-error bg-error-container/20 text-error font-bold focus:border-error focus:ring-1 focus:ring-error' : 'border border-outline-variant focus:border-primary'}`} 
                                />
                                {isQtyErr && <span className="text-[11px] font-semibold text-error mt-1 leading-tight text-center block">Phải &gt; 0</span>}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <input 
                                type="text" 
                                value={item.unit}
                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                className="w-full py-1.5 px-2 text-center text-body-sm font-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary outline-none" 
                                placeholder="VD: Cái..."
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex flex-col items-end">
                                <input 
                                  type="number" 
                                  value={item.price}
                                  onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                  className={`w-full py-1.5 px-2 text-right rounded-lg text-body-sm font-numeric-data outline-none ${isPriceErr ? 'border-2 border-error bg-error-container/20 text-error font-bold focus:border-error focus:ring-1 focus:ring-error' : 'border border-outline-variant focus:border-primary'}`} 
                                />
                                {isPriceErr && <span className="text-[11px] font-semibold text-error mt-1 leading-tight text-right block">Phải &gt; 0 ₫</span>}
                              </div>
                            </td>
                            <td className={`py-3 px-4 text-right font-numeric-data font-semibold ${isErrorRow ? 'text-error' : 'text-on-surface'}`}>
                              {((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button type="button" onClick={() => removeItem(index)} className={`p-1 rounded transition-colors ${isErrorRow ? 'text-error hover:bg-error-container/30' : 'text-outline hover:text-error'}`}>
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button type="button" onClick={addItem} className="w-full py-2.5 px-4 border-2 border-dashed border-primary/20 hover:border-primary text-primary hover:bg-surface-container-low rounded-lg text-body-sm font-label-md flex items-center justify-center gap-2 transition-colors duration-150">
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  <span>Thêm giáo cụ</span>
                </button>

                <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[24px]">calculate</span>
                    </div>
                    <div>
                      <span className="text-body-md font-label-md font-semibold text-on-surface block">Tổng chi phí dự kiến</span>
                      <span className="text-caption font-caption text-on-surface-variant">Tự động cộng từ thành tiền của các dòng</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-numeric-data text-primary">{estimatedTotal.toLocaleString('vi-VN')} ₫</span>
                    <span className="block text-caption font-caption text-outline">(Đã bao gồm thuế GTGT & dự kiến phí vận chuyển)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="fixed bottom-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant/80 py-3.5 px-8 shadow-lg flex items-center justify-between backdrop-blur-md left-64">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${validationErrors.length > 0 ? 'bg-error-container text-error' : 'bg-surface-container text-primary'}`}>
            <span className="material-symbols-outlined text-[22px]">{validationErrors.length > 0 ? 'warning' : 'shopping_bag'}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`text-caption font-caption leading-tight ${validationErrors.length > 0 ? 'text-error font-bold' : 'text-outline'}`}>Tổng chi phí dự kiến ({formData.items.length} danh mục):</span>
              {validationErrors.length > 0 && <span className="text-caption font-caption text-error bg-error-container px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">cancel</span> Có lỗi validation</span>}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-bold font-numeric-data ${validationErrors.length > 0 ? 'text-outline' : 'text-primary'}`}>{estimatedTotal.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/teacher/my-proposals')} className="px-5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-bright text-on-surface-variant font-label-md text-label-md transition-colors duration-150">
            Hủy
          </button>

          {validationErrors.length > 0 ? (
            <div className="relative group">
              <button disabled type="button" className="px-6 py-2.5 rounded-lg bg-surface-variant text-outline cursor-not-allowed font-label-md text-label-md flex items-center gap-2 border border-outline-variant/80 pointer-events-auto">
                <span>Gửi đề xuất</span>
                <span className="material-symbols-outlined text-[18px]">block</span>
              </button>
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-inverse-surface text-inverse-on-surface text-caption rounded-lg shadow-lg whitespace-nowrap z-50">
                <span className="material-symbols-outlined text-[14px] text-error-container">error</span>
                <span>Vui lòng sửa các lỗi bôi đỏ để kích hoạt nút gửi</span>
              </div>
            </div>
          ) : (
            <button type="button" onClick={handlePreSubmit} disabled={loading} className={`px-6 py-2.5 rounded-lg text-on-primary font-label-md text-label-md shadow-sm transition-all duration-150 flex items-center gap-2 ${loading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-container'}`}>
              <span>{loading ? 'Đang kiểm tra...' : 'Gửi đề xuất'}</span>
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>{loading ? 'sync' : 'send'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== 3. MODAL POP-UP XÁC NHẬN GỬI (ĐÃ CẬP NHẬT GIAO DIỆN) ==================== */}
      {showConfirmModal && (
        <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[3px] transition-all" role="dialog">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col transform transition-transform">
            
            <div className="p-6 pb-4 border-b border-outline-variant/60 flex items-start justify-between">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-surface-container text-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">send</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-headline-md font-headline-md text-on-surface">Xác nhận gửi đề xuất</h2>
                    <span className="px-2 py-0.5 rounded text-caption font-numeric-data font-medium bg-surface-container-high text-primary border border-outline-variant">
                      {previewCode}
                    </span>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">Gửi đề xuất mua sắm giáo cụ lên hệ thống để cấp Quản lý phê duyệt.</p>
                </div>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-150">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-6 pt-5 space-y-4">
              <div className="text-body-md font-headline-sm text-on-surface">Bạn có chắc chắn muốn gửi đề xuất mua sắm này?</div>
              
              <div className="bg-surface-container-low rounded-xl border border-outline-variant/80 p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-on-surface-variant">Người đề xuất:</span>
                  <span className="font-medium text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                    {user?.fullName} <span className="text-on-surface-variant font-normal">({user?.groupName})</span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-on-surface-variant">Thời gian cần hàng:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-numeric-data text-on-surface font-medium">{formData.requiredDate.split('-').reverse().join('/')}</span>
                    {formData.priority === 'HIGH' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block"></span>Ưu tiên cao
                      </span>
                    )}
                    {formData.priority === 'MEDIUM' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block"></span>Ưu tiên TB
                      </span>
                    )}
                    {formData.priority === 'LOW' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant border border-outline-variant flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline inline-block"></span>Ưu tiên thấp
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-on-surface-variant">Số loại giáo cụ:</span>
                  <span className="font-medium text-on-surface">{formData.items.length} danh mục</span>
                </div>
                
                <div className="border-t border-outline-variant/60 my-1"></div>
                
                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-col">
                    <span className="text-label-md font-label-md text-on-surface">Tổng chi phí dự kiến:</span>
                    <span className="text-[11px] text-on-surface-variant font-normal">Đã gồm thuế VAT & dự toán vận chuyển</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-headline-md font-headline-md font-numeric-data text-primary font-bold">{estimatedTotal.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 px-6 bg-surface-container-low/60 border-t border-outline-variant/60 flex items-center justify-end gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors duration-150 font-label-md text-label-md">
                Hủy
              </button>
              <button onClick={confirmSubmit} disabled={loading} className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary transition-all duration-150 font-label-md text-label-md shadow-sm flex items-center gap-2">
                <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>{loading ? 'sync' : 'send'}</span>
                <span>{loading ? 'Đang gửi...' : 'Xác nhận gửi đề xuất'}</span>
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}