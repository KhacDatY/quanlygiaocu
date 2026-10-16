// src/pages/Administrative/PurchaseConfirmationForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount || 0);

const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Component Toast thông báo thành công
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

export default function PurchaseConfirmationForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toastConfig, setToastConfig] = useState(null);

  // Form States
  const [vendorName, setVendorName] = useState('');
  const [actualPrice, setActualPrice] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Validation States
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get(`/proposals/${id}`);
        setProposal(res);
      } catch (err) {
        alert('Lỗi tải dữ liệu đề xuất');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const approvedBudget = proposal?.estimatedTotal || 0;
  const numActualPrice = parseInt(actualPrice.replace(/[^\d]/g, ''), 10) || 0;
  
  const diff = numActualPrice - approvedBudget;
  const diffPercent = approvedBudget ? ((Math.abs(diff) / approvedBudget) * 100).toFixed(2) : 0;

  // Real-time Validation
  useEffect(() => {
    const newErrors = {};
    if (!vendorName.trim()) newErrors.vendorName = "Thiếu tên Nhà cung cấp";
    if (numActualPrice <= 0) newErrors.actualPrice = "Giá mua thực tế bằng 0 ₫";
    if (!orderDate) newErrors.orderDate = "Chưa chọn ngày đặt hàng";
    if (!deliveryDate) newErrors.deliveryDate = "Chưa chọn ngày giao dự kiến";
    
    if (orderDate && deliveryDate && new Date(deliveryDate) < new Date(orderDate)) {
      newErrors.deliveryDateConflict = "Ngày giao trước ngày đặt hàng";
    }

    setErrors(newErrors);
  }, [vendorName, actualPrice, orderDate, deliveryDate, numActualPrice]);

  const hasErrors = Object.keys(errors).length > 0;

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    if (raw) setActualPrice(new Intl.NumberFormat('vi-VN').format(raw));
    else setActualPrice('');
  };

  const handleOpenModal = () => {
    setIsSubmitted(true);
    if (!hasErrors) {
      setShowModal(true);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      const payload = {
        supplierName: vendorName,
        actualTotal: numActualPrice,
        orderDate,
        deliveryDate,
        note: notes
      };
      await apiClient.post(`/proposals/${id}/confirm-purchase`, payload);
      
      setShowModal(false);
      setToastConfig({
        borderColor: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
        titleColor: 'text-emerald-900', badgeBg: 'bg-emerald-100', badgeColor: 'text-emerald-800',
        icon: 'check_circle', title: 'Lưu phiếu thành công',
        message: `Thông tin mua hàng cho đề xuất <strong class="text-primary font-mono">${proposal.code}</strong> đã được lưu. Đề xuất đã chuyển sang trạng thái <strong>Đang mua hàng</strong>.`
      });

      setTimeout(() => {
        setToastConfig(null);
        navigate('/administrative/pending-purchases');
      }, 3500);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi lưu phiếu.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Logic Giao hàng SLA
  const getDeliveryStatus = () => {
    if (!deliveryDate || !proposal?.requiredDate) return null;
    const deadline = new Date(proposal.requiredDate);
    const delivery = new Date(deliveryDate);
    const diffDays = Math.ceil((deadline - delivery) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { isLate: true, text: `Giao sau hạn chót (trễ ${Math.abs(diffDays)} ngày)`, diffDays };
    } else if (diffDays === 0) {
      return { isLate: false, text: `Giao đúng hạn chót`, diffDays };
    }
    return { isLate: false, text: `Giao trước hạn chót (sớm ${diffDays} ngày)`, diffDays };
  };

  const deliveryStatus = getDeliveryStatus();

  if (loading) return <div className="flex items-center justify-center min-h-[calc(100vh-64px)]"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;

  return (
    <div className="min-h-screen bg-background pb-28">
      <ToastNotification show={!!toastConfig} config={toastConfig} onClose={() => setToastConfig(null)} />

      {/* TOP FLOATING VALIDATION ERROR TOAST */}
      {isSubmitted && hasErrors && (
        <div className="fixed top-5 right-8 z-50 flex items-start gap-3 bg-white border border-rose-200 rounded-xl p-4 shadow-xl shadow-rose-950/10 max-w-md animate-in slide-in-from-top-4 duration-300">
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <span className="material-symbols-outlined text-[20px]">error</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-900">Không thể lưu phiếu xác nhận</h4>
              <span className="text-[10px] font-mono text-slate-400">Vừa xong</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Có <strong className="text-rose-600 font-semibold">{Object.keys(errors).length} trường thông tin</strong> chưa hợp lệ hoặc thiếu dữ liệu bắt buộc. Vui lòng kiểm tra và sửa đổi trước khi tiếp tục.
            </p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors" onClick={() => setIsSubmitted(false)} type="button">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      <main className="p-8 max-w-[1520px] mx-auto space-y-6">
        {/* BREADCRUMB NAVIGATION */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-normal">
          <span className="cursor-pointer hover:text-primary flex items-center gap-1" onClick={() => navigate('/administrative')}>
            <span className="material-symbols-outlined text-[16px]">home</span> Trang chủ
          </span>
          <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
          <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/administrative/pending-purchases')}>Đề xuất đã duyệt – chưa mua</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
          <span className="cursor-pointer hover:text-primary font-mono" onClick={() => navigate(`/administrative/proposal-detail/${id}`)}>Chi tiết {proposal.code}</span>
          <span className="material-symbols-outlined text-[14px] text-slate-300">chevron_right</span>
          <span className={`${isSubmitted && hasErrors ? 'text-rose-600' : 'text-primary'} font-semibold`}>Tạo phiếu xác nhận</span>
        </nav>

        {/* HEADER TRANG */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-200/80">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                Phiếu xác nhận thông tin mua hàng
              </h1>
              <span className="font-mono text-sm font-bold bg-slate-100 text-primary border border-blue-200 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                <span className="material-symbols-outlined text-[15px]">tag</span>
                {proposal.code}
              </span>
              {isSubmitted && hasErrors ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  Chưa hoàn tất ({Object.keys(errors).length} lỗi cần xử lý)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Đã phê duyệt tài chính
                </span>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-slate-500 mt-1.5 max-w-3xl">
              Nhập thông tin thực tế từ nhà cung cấp và chứng từ để hoàn tất thủ tục mua sắm giáo cụ.
            </p>
          </div>
          <div>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-primary bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg transition-colors shadow-2xs">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span className="">Quay lại chi tiết đề xuất</span>
            </button>
          </div>
        </div>

        {/* BANNER CẢNH BÁO LỖI TỔNG THỂ */}
        {isSubmitted && hasErrors && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50/90 border border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm" id="global-error-banner">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">report</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">Vui lòng kiểm tra lại các trường thông tin bắt buộc và dữ liệu không hợp lệ</h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Có {Object.keys(errors).length} lỗi cần được khắc phục trước khi tiếp tục lưu phiếu xác nhận mua hàng vào hệ thống:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {errors.vendorName && (
                    <a href="#vendor-name" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50 transition-colors shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">error</span> 1. {errors.vendorName}
                    </a>
                  )}
                  {errors.actualPrice && (
                    <a href="#actual-price" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50 transition-colors shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">error</span> 2. {errors.actualPrice}
                    </a>
                  )}
                  {errors.orderDate && (
                    <a href="#order-date" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50 transition-colors shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">error</span> 3. {errors.orderDate}
                    </a>
                  )}
                  {errors.deliveryDate && (
                    <a href="#delivery-date" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50 transition-colors shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">error</span> 4. {errors.deliveryDate}
                    </a>
                  )}
                  {errors.deliveryDateConflict && (
                    <a href="#delivery-date" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50 transition-colors shadow-2xs">
                      <span className="material-symbols-outlined text-[14px]">error</span> 5. {errors.deliveryDateConflict}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => document.getElementById('vendor-name').focus()} className="shrink-0 self-start md:self-center px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all">
              <span className="">Cuộn đến lỗi đầu tiên</span>
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 flex flex-col gap-6">
            <form className="space-y-6" id="procurement-form" onSubmit={e => e.preventDefault()}>
              {/* Main Form Card */}
              <div className={`bg-surface-container-lowest rounded-xl shadow-sm p-6 ${isSubmitted && hasErrors ? 'border border-rose-200/90 ring-1 ring-rose-200/50' : 'border border-slate-200/90'}`}>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[22px] ${isSubmitted && hasErrors ? 'text-rose-600' : 'text-primary'}`}>shopping_cart_checkout</span>
                    <h2 className="font-headline-md text-headline-md text-slate-900 font-bold">Thông tin mua sắm thực tế</h2>
                  </div>
                  {isSubmitted && hasErrors ? (
                    <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span> Phát hiện lỗi nhập liệu
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Các trường có dấu (<span className="text-rose-500 font-bold">*</span>) là bắt buộc</span>
                  )}
                </div>

                <div className="space-y-5">
                  {/* ROW 1: Nhà cung cấp & Giá mua thực tế */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* TRƯỜNG 1: Nhà cung cấp */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-label-md text-label-md text-slate-800" htmlFor="vendor-name">
                          Nhà cung cấp <span className="text-rose-500 font-bold">*</span>
                        </label>
                        {isSubmitted && errors.vendorName && <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Bắt buộc</span>}
                      </div>
                      <div className="relative">
                        <span className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] ${isSubmitted && errors.vendorName ? 'text-rose-500' : 'text-slate-400'}`}>store</span>
                        <input 
                          id="vendor-name" type="text" value={vendorName} onChange={e => setVendorName(e.target.value)}
                          className={`w-full h-11 pl-10 pr-4 text-sm rounded-lg focus:outline-none transition font-medium ${isSubmitted && errors.vendorName ? 'bg-rose-50/20 border-2 border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-200 placeholder:text-rose-300 text-slate-900' : 'bg-white border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/15 text-slate-900 placeholder:text-slate-400'}`}
                          placeholder="Nhập tên nhà cung cấp..."
                        />
                        {isSubmitted && errors.vendorName && <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 text-[18px]">error</span>}
                      </div>
                      {isSubmitted && errors.vendorName && (
                        <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px]">error</span> Vui lòng nhập tên Nhà cung cấp thực tế.
                        </p>
                      )}
                    </div>

                    {/* TRƯỜNG 2: Giá mua thực tế */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-label-md text-label-md text-slate-800" htmlFor="actual-price">
                          Giá mua thực tế (VNĐ) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <span className="text-xs text-slate-500 font-mono">Dự toán đã duyệt: {formatCurrency(approvedBudget)}</span>
                      </div>
                      <div className="relative">
                        <span className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[19px] ${isSubmitted && errors.actualPrice ? 'text-rose-500' : 'text-slate-400'}`}>payments</span>
                        <input 
                          id="actual-price" type="text" value={actualPrice} onChange={handlePriceChange}
                          className={`w-full h-11 pl-10 pr-10 text-base font-mono font-bold rounded-lg focus:outline-none transition text-right tracking-tight ${isSubmitted && errors.actualPrice ? 'bg-rose-50/20 border-2 border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-200 text-rose-700' : 'bg-white border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/15 text-slate-900'}`}
                          placeholder="0"
                        />
                        <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-sm ${isSubmitted && errors.actualPrice ? 'text-rose-500' : 'text-slate-500'}`}>₫</span>
                      </div>
                      {isSubmitted && errors.actualPrice && (
                        <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px]">error</span> Giá mua thực tế phải lớn hơn 0 VNĐ.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Box tính toán chênh lệch giá */}
                  <div className={`p-3 rounded-lg border transition-all duration-200 flex items-center justify-between ${numActualPrice === 0 ? (isSubmitted && errors.actualPrice ? 'bg-rose-50/50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600') : diff < 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : diff === 0 ? 'bg-blue-50 border-blue-200 text-primary' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">{numActualPrice === 0 ? 'help_outline' : diff < 0 ? 'trending_down' : diff > 0 ? 'trending_up' : 'horizontal_rule'}</span>
                      <span className="text-xs font-semibold">{numActualPrice === 0 ? 'Chưa thể so sánh dự toán do số tiền bằng 0 ₫.' : diff < 0 ? `Tiết kiệm ${formatCurrency(Math.abs(diff))} (${diffPercent}% so với dự toán)` : diff > 0 ? `Vượt ngân sách +${formatCurrency(diff)} (+${diffPercent}%)` : `Trùng khớp 100% với dự toán ${formatCurrency(approvedBudget)}`}</span>
                    </div>
                    {numActualPrice === 0 ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isSubmitted && errors.actualPrice ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>{isSubmitted && errors.actualPrice ? 'Chưa hợp lệ' : 'Chưa có giá'}</span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${diff < 0 ? 'bg-emerald-100 text-emerald-800' : diff > 0 ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>{diff < 0 ? 'Tối ưu chi phí' : diff > 0 ? 'Vượt hạn mức' : 'Bằng hạn mức'}</span>
                    )}
                  </div>

                  {/* ROW 2: Ngày đặt hàng & Ngày dự kiến giao */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ngày đặt hàng */}
                    <div>
                      <label className="block font-label-md text-label-md text-slate-800 mb-1.5" htmlFor="order-date">
                        Ngày đặt hàng <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <span className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] ${isSubmitted && errors.orderDate ? 'text-rose-500' : 'text-slate-400'}`}>calendar_today</span>
                        <input 
                          id="order-date" type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
                          className={`w-full h-11 pl-10 pr-3 text-sm rounded-lg focus:outline-none transition font-mono ${isSubmitted && errors.orderDate ? 'bg-rose-50/20 border-2 border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-200 text-rose-900 font-semibold' : 'bg-white border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/15 text-slate-800'}`} 
                        />
                        {isSubmitted && errors.orderDate && <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 text-[18px]">error</span>}
                      </div>
                      {isSubmitted && errors.orderDate && <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">error</span> Vui lòng chọn ngày đặt hàng.</p>}
                      {!errors.orderDate && <span className="text-[11px] text-slate-400 mt-1 block">Ngày ký hợp đồng / đặt hàng</span>}
                    </div>

                    {/* Ngày dự kiến giao */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-label-md text-label-md text-slate-800" htmlFor="delivery-date">
                          Ngày dự kiến giao (*) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        {isSubmitted && (errors.deliveryDate || errors.deliveryDateConflict) && <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">{errors.deliveryDateConflict ? 'Sai logic ngày' : 'Bắt buộc'}</span>}
                      </div>
                      <div className="relative">
                        <span className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] ${isSubmitted && (errors.deliveryDate || errors.deliveryDateConflict) ? 'text-rose-500' : 'text-slate-400'}`}>local_shipping</span>
                        <input 
                          id="delivery-date" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                          className={`w-full h-11 pl-10 pr-10 text-sm rounded-lg focus:outline-none transition font-mono ${isSubmitted && (errors.deliveryDate || errors.deliveryDateConflict) ? 'bg-rose-50/20 border-2 border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-200 text-rose-900 font-semibold' : 'bg-white border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/15 text-slate-800'}`} 
                        />
                        {isSubmitted && (errors.deliveryDate || errors.deliveryDateConflict) && <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 text-[18px]">error</span>}
                      </div>
                      {isSubmitted && errors.deliveryDate && <p className="text-xs text-rose-600 mt-1.5 font-medium flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">error</span> Vui lòng chọn ngày giao hàng.</p>}
                    </div>
                  </div>

                  {/* Cảnh báo xung đột thời gian & SLA tiến độ (MẪU CHUẨN) */}
                  <div className={`grid grid-cols-1 ${!errors.deliveryDateConflict && !(deliveryStatus?.isLate) ? 'md:grid-cols-2' : ''} gap-4`}>
                    
                    {errors.deliveryDateConflict ? (
                      <div className="p-3.5 rounded-lg border bg-rose-50/90 border-rose-200 text-xs text-rose-800 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5">warning</span>
                          <div>
                            <span className="font-bold text-rose-900">Xung đột thứ tự thời gian:</span>
                            <p className="text-[11px] text-rose-700 mt-0.5">Ngày nhận hàng thực tế dự kiến ({formatDateToDDMMYYYY(deliveryDate)}) sớm hơn thời điểm đặt đơn hàng ({formatDateToDDMMYYYY(orderDate)}).</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-rose-200 text-rose-800 shrink-0">Không hợp lệ</span>
                      </div>
                    ) : deliveryStatus?.isLate ? (
                      <div className="p-3.5 rounded-lg border bg-rose-50/90 border-rose-200 text-xs text-rose-800 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5">error</span>
                          <div>
                            <span className="font-bold text-rose-900">Cảnh báo trễ hạn:</span>
                            <p className="text-[11px] text-rose-700 mt-0.5">Giao sau hạn chót ({formatDateToDDMMYYYY(proposal.requiredDate)}) <strong className="font-mono text-rose-900">{Math.abs(deliveryStatus.diffDays)} ngày</strong>. Cần xin phê duyệt ngoại lệ khi lưu.</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-rose-200 text-rose-800 shrink-0">Trễ SLA</span>
                      </div>
                    ) : deliveryStatus && !deliveryStatus.isLate ? (
                      <div className="p-3.5 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] text-xs text-[#059669] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[17px]">check_circle</span>
                          <span>✓ Hợp lệ: {deliveryStatus.text}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#059669]">Đảm bảo SLA</span>
                      </div>
                    ) : null}

                    {/* Chỉ hiện cảnh báo vàng NẾU KHÔNG CÓ CẢNH BÁO ĐỎ. 
                        Nếu là cảnh báo xanh (đúng hạn) thì hiện song song như mẫu hình ảnh */}
                    {!errors.deliveryDateConflict && !(deliveryStatus?.isLate) && (
                      <div className="p-3.5 rounded-lg border border-[#fde047] bg-[#fefce8] text-xs text-[#854d0e] flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[#d97706] text-[18px] shrink-0 mt-0.5">warning</span>
                        <div>
                          <span className="font-bold text-[#92400e]">Lưu ý quản trị tiến độ:</span>
                          <span className=""> Nếu giao sau <strong className="underline font-mono">{formatDateToDDMMYYYY(proposal.requiredDate)}</strong>, hệ thống sẽ kích hoạt cảnh báo trễ hạn.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TRƯỜNG 5: Ghi chú */}
                  <div>
                    <label className="block font-label-md text-label-md text-slate-800 mb-1.5" htmlFor="purchase-notes">
                      Ghi chú chi tiết mua sắm
                    </label>
                    <textarea 
                      id="purchase-notes" value={notes} onChange={e => setNotes(e.target.value)} 
                      rows="3" 
                      className="w-full p-3.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition placeholder:text-slate-400 text-slate-800" 
                      placeholder="Ghi chú thêm về điều khoản giao hàng, chiết khấu, bảo hành..."
                    ></textarea>
                    <span className="text-[11px] text-slate-400 mt-1 block">Tối đa 500 ký tự ghi chú nội bộ.</span>
                  </div>

                  {/* TRƯỜNG 6: Khu vực Đính kèm chứng từ */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block font-label-md text-label-md text-slate-800">
                        Chứng từ, hợp đồng & Hóa đơn kèm theo <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span className="text-xs text-slate-500">Đã đính kèm <span className="font-bold text-slate-800">0</span> file</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-5 border-2 border-dashed border-blue-300 hover:border-primary rounded-xl bg-blue-50/30 hover:bg-blue-50/60 p-6 text-center transition-all duration-150 cursor-pointer group h-full flex flex-col items-center justify-center min-h-[190px]">
                        <div className="w-12 h-12 rounded-full bg-blue-100/70 group-hover:bg-blue-100 flex items-center justify-center text-primary transition-colors mb-2">
                          <span className="material-symbols-outlined text-[28px]">upload_file</span>
                        </div>
                        <div className="font-headline-sm text-sm text-slate-800 font-semibold group-hover:text-primary transition-colors mb-1">
                          Kéo thả file báo giá, hóa đơn vào đây
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                          hoặc click để chọn file từ máy tính
                        </div>
                        <div className="text-[11px] text-slate-400">
                          PDF, PNG, JPG, XLSX (tối đa 25MB/file)
                        </div>
                      </div>
                      <div className="lg:col-span-7 space-y-2">
                        {/* Placeholder cho list file tải lên */}
                        <div className="text-sm text-slate-500 italic p-4 border border-dashed rounded-lg text-center">
                          Chưa có file chứng từ đính kèm
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ================= STICKY ACTION BAR DƯỚI CÙNG VỚI CẢNH BÁO LỖI ================= */}
      <aside className={`fixed bottom-0 left-[260px] right-0 bg-white/95 backdrop-blur-md border-t px-8 py-3.5 flex items-center justify-between shadow-xl z-30 ${isSubmitted && hasErrors ? 'border-rose-200' : 'border-slate-200/90'}`}>
        {/* Bên trái: Mã DX, Giá mua thực tế, Tag chênh lệch */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Mã đề xuất:</span>
            <span className="font-mono text-sm font-bold text-primary bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">{proposal.code}</span>
          </div>
          <div className="h-5 w-[1px] bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Giá thực tế:</span>
            <span className={`font-mono text-lg font-extrabold tracking-tight ${isSubmitted && errors.actualPrice ? 'text-rose-600' : 'text-slate-900'}`}>{actualPrice || '0'} ₫</span>
          </div>
          
          {/* Validation Tag hoặc Chênh lệch Tag */}
          {isSubmitted && hasErrors ? (
            <span className="text-rose-700 bg-rose-50 font-semibold px-2.5 py-1 rounded-md text-xs border border-rose-200 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">error</span>
              <span>Có {Object.keys(errors).length} lỗi validation cần xử lý trước khi lưu</span>
            </span>
          ) : (
            numActualPrice > 0 && !errors.actualPrice && (
              <div className={`font-semibold px-2.5 py-1 rounded-md text-xs border flex items-center gap-1 ${diff < 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : diff > 0 ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-blue-700 bg-blue-50 border-blue-200'}`}>
                <span className="material-symbols-outlined text-[15px]">{diff < 0 ? 'trending_down' : diff > 0 ? 'trending_up' : 'horizontal_rule'}</span>
                <span>{diff < 0 ? `Tiết kiệm ${formatCurrency(Math.abs(diff))}` : diff > 0 ? `Vượt ngân sách +${formatCurrency(diff)}` : 'Đúng hạn mức'}</span>
              </div>
            )
          )}
        </div>
        
        {/* Bên phải: Nút Hủy và Nút Lưu */}
        <div className="flex items-center gap-3">
          <button onClick={() => { if(window.confirm('Bạn có muốn hủy chỉnh sửa và quay lại chi tiết đề xuất?')) navigate(-1); }} className="border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-100 px-5 py-2.5 rounded-lg text-xs font-medium transition-colors" type="button">
            Hủy bỏ
          </button>
          <div className="relative group">
            <button 
              onClick={handleOpenModal} 
              className={`px-6 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${isSubmitted && hasErrors ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none' : 'bg-[#003883] hover:bg-[#002d6b] text-white shadow-sm shadow-primary/20 active:scale-[0.98]'}`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Lưu phiếu xác nhận thông tin mua hàng</span>
            </button>
            {/* Tooltip lỗi khi hover vào nút bị disable */}
            {isSubmitted && hasErrors && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
                <span className="material-symbols-outlined text-[14px] text-rose-400">lock</span>
                <span>Vui lòng sửa các lỗi bôi đỏ để kích hoạt nút lưu phiếu</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ================= POPUP MODAL XÁC NHẬN LƯU THỦ TỤC ================= */}
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="bg-white rounded-[20px] max-w-lg w-full shadow-2xl overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200 relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 pb-2">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <div>
                  <h3 className="text-[19px] text-slate-900 font-bold mb-1">Xác nhận lưu phiếu</h3>
                  <p className="text-sm text-slate-500">Lưu phiếu xác nhận thông tin mua hàng</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors absolute top-5 right-5">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <div className="px-6 pb-6">
              <p className="text-[14.5px] text-slate-700 mb-5 leading-relaxed">
                Bạn có chắc chắn muốn lưu phiếu xác nhận thông tin mua hàng cho đề xuất <strong className="font-mono text-[#003883] font-bold">{proposal.code}</strong>?
              </p>
              
              {/* Review Summary Box in Modal */}
              <div className="bg-[#f4f7fb] rounded-xl p-4 border border-slate-100 space-y-3 mb-5">
                <div className="flex items-center justify-between text-[13.5px]">
                  <span className="text-slate-500">Mã đề xuất:</span>
                  <span className="font-mono font-bold text-[#003883]">{proposal.code}</span>
                </div>
                <div className="flex items-center justify-between text-[13.5px]">
                  <span className="text-slate-500">Nhà cung cấp:</span>
                  <span className="font-semibold text-slate-800 text-right">{vendorName}</span>
                </div>
                
                <div className="my-2 border-t border-slate-200/80"></div>
                
                <div className="flex items-center justify-between text-[13.5px]">
                  <span className="text-slate-500">Giá mua thực tế:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-[16px] ${diff < 0 ? 'text-[#059669]' : diff > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {actualPrice} <span className="underline decoration-2 underline-offset-2">đ</span>
                    </span>
                    {diff !== 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${diff < 0 ? 'bg-[#d1fae5] text-[#059669]' : 'bg-rose-100 text-rose-700'}`}>
                        {diff < 0 ? `Tiết kiệm ${formatCurrency(Math.abs(diff))} (-${diffPercent}%)` : `Vượt hạn mức (+${diffPercent}%)`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="my-2 border-t border-slate-200/80"></div>

                <div className="grid grid-cols-2 gap-4 text-[13.5px]">
                  <div className="flex flex-col">
                    <span className="text-slate-500 mb-0.5">Ngày đặt hàng:</span>
                    <span className="font-semibold text-slate-800 font-mono">{formatDateToDDMMYYYY(orderDate)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 mb-0.5">Ngày dự kiến giao:</span>
                    <span className="font-semibold text-slate-800 font-mono">{formatDateToDDMMYYYY(deliveryDate)}</span>
                    {!deliveryStatus?.isLate && (
                      <span className="text-[#059669] text-[11px] font-medium mt-0.5">sớm {Math.abs(deliveryStatus.diffDays)} ngày so với hạn chót</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-[#f0f7ff] border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#003883] text-[18px] shrink-0 mt-0.5">info</span>
                <p className="text-[13px] text-[#1e3a8a] leading-relaxed">
                  Sau khi xác nhận, đề xuất sẽ chuyển sang trạng thái <strong className="font-bold">Đã đặt hàng</strong>. Trưởng nhóm chuyên môn sẽ nhận được thông báo đã đặt hàng.
                </p>
              </div>
            </div>
            
            {/* Modal Actions */}
            <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-[13.5px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors">
                Hủy
              </button>
              <button 
                onClick={handleSubmit} disabled={submitLoading}
                className="px-6 py-2.5 text-[13.5px] font-semibold text-white bg-[#003883] hover:bg-[#002d6b] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {submitLoading ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">check</span>
                )}
                <span>Xác nhận lưu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}