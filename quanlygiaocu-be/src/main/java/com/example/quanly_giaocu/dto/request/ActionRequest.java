package com.example.quanly_giaocu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActionRequest {
    @NotBlank(message = "Vui lòng nhập nội dung (lý do)")
    private String note;
}