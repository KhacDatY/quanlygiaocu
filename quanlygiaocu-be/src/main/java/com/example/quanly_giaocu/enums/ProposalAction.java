package com.example.quanly_giaocu.enums;

public enum ProposalAction {
    CREATED("Tạo mới đề xuất"),
    SYSTEM_FORWARD("Hệ thống chuyển tiếp"),
    UPDATED("Cập nhật đề xuất"),
    REQUEST_REVISION("Yêu cầu chỉnh sửa"),
    APPROVED_NEEDS("Đã duyệt nhu cầu"),
    APPROVED_BUDGET("Đã duyệt ngân sách"),
    APPROVED_FINAL("Giám đốc duyệt chi"),
    REJECTED("Từ chối đề xuất"),
    PURCHASED("Xác nhận lưu phiếu mua hàng");

    private final String description;

    ProposalAction(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}