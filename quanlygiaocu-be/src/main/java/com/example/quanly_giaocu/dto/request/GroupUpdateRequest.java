package com.example.quanly_giaocu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupUpdateRequest {
    @NotBlank(message = "Tên nhóm không được để trống")
    private String name;
}