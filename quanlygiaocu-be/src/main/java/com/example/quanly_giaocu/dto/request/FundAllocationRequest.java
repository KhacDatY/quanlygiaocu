package com.example.quanly_giaocu.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FundAllocationRequest {
    @NotNull(message = "Số tiền cấp không được để trống")
    @DecimalMin(value = "0.1", message = "Số tiền cấp phải lớn hơn 0")
    private Double amount;
}