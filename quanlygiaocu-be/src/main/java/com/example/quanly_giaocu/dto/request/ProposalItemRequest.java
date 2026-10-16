package com.example.quanly_giaocu.dto.request;

import com.example.quanly_giaocu.enums.EquipmentCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProposalItemRequest {
    @NotBlank(message = "Tên giáo cụ không được để trống")
    private String name;

    @NotNull(message = "Vui lòng chọn loại giáo cụ")
    private EquipmentCategory category;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    @NotBlank(message = "Đơn vị tính không được để trống")
    private String unit;

    @NotNull(message = "Đơn giá không được để trống")
    @Min(value = 0, message = "Đơn giá không hợp lệ")
    private Double price;
}
