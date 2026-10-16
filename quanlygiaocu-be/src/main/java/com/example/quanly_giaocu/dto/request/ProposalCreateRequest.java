package com.example.quanly_giaocu.dto.request;

import com.example.quanly_giaocu.enums.EquipmentCategory;
import com.example.quanly_giaocu.enums.Priority;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
@Data
public class ProposalCreateRequest {
    @NotBlank(message = "Mục đích sử dụng không được để trống")
    private String purpose;

    @NotNull(message = "Ngày cần hàng không được để trống")
    private LocalDate requiredDate;

    @NotNull(message = "Vui lòng chọn mức độ ưu tiên")
    private Priority priority;

    @NotEmpty(message = "Danh sách giáo cụ không được rỗng")
    private List<ProposalItemRequest> items;

    private List<AttachmentRequest> attachments;
}
