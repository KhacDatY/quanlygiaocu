package com.example.quanly_giaocu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PurchaseConfirmationRequest {
    @NotBlank(message = "Tên nhà cung cấp không được để trống")
    private String supplierName;

    @NotNull(message = "Ngày đặt hàng không được để trống")
    private LocalDate orderDate;

    @NotNull(message = "Ngày giao dự kiến không được để trống")
    private LocalDate deliveryDate;

    @NotNull(message = "Giá mua thực tế không được để trống")
    private Double actualTotal;

    private String note;

    // File hợp đồng, hóa đơn, biên bản kiểm tra (PURCHASE_DOC)
    private List<AttachmentRequest> purchaseAttachments;
}