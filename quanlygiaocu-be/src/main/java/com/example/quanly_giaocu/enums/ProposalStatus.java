package com.example.quanly_giaocu.enums;

public enum ProposalStatus {
    PENDING_MANAGER,      // Chờ Quản lý duyệt nhu cầu
    PENDING_ACCOUNTANT,   // Chờ Kế toán duyệt ngân sách
    PENDING_DIRECTOR,     // Chờ Giám đốc duyệt chi
    NEEDS_REVISION,       // Yêu cầu chỉnh sửa
    REJECTED,             // Bị từ chối
    APPROVED,             // Đã duyệt - chờ mua (Hành chính nhận)
    PURCHASING,           // Đã đặt hàng (Hành chính đã lưu phiếu)
    COMPLETED             // Hoàn tất bàn giao
}
