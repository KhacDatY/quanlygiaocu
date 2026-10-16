package com.example.quanly_giaocu.dto.response;

import com.example.quanly_giaocu.enums.EquipmentCategory;
import com.example.quanly_giaocu.enums.Priority;
import com.example.quanly_giaocu.enums.ProposalStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
@Data
@Builder
public class ProposalResponse {
    private Long id;
    private String code;
    private String purpose;
    private LocalDate requiredDate;
    private Priority priority;
    private ProposalStatus status;
    private Double estimatedTotal;
    private LocalDateTime createdAt;

    // THÔNG TIN NGƯỜI TẠO (Không trả về password, chỉ trả về tên và chức vụ)
    private String creatorName;
    private String creatorPosition;
    private String creatorGroupName;

    // DANH SÁCH CHI TIẾT
    private List<ProposalItemResponse> items;
    private List<ProposalAttachmentResponse> attachments;
    private List<ProposalHistoryResponse> histories;

    private String supplierName;
    private LocalDate orderDate;
    private LocalDate deliveryDate;
    private Double actualTotal;
}