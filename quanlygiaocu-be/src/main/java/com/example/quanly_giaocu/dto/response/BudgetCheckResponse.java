package com.example.quanly_giaocu.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BudgetCheckResponse {
    private String periodLabel; // VD: "Quý 1/2026 (Tháng 01 - Tháng 03/2026)"

    private Double allocatedAmount; // Ngân sách được cấp
    private Double spentAmount;     // Đã thực chi
    private Double committedAmount; // Đã cam kết (PO chờ chi)

    private Double availableBeforeApproval; // Ngân sách khả dụng trước duyệt
    private Double proposalEstimatedTotal;  // Tổng chi phí đề xuất này
    private Double remainingIfApproved;     // Ngân sách còn lại nếu duyệt

    private boolean isBudgetSufficient; // Đủ ngân sách hay không
}