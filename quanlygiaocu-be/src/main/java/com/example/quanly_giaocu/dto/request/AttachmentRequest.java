package com.example.quanly_giaocu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AttachmentRequest {
    @NotBlank(message = "Tên file không được để trống")
    private String fileName;

    @NotBlank(message = "URL file không được để trống")
    private String fileUrl;

    private String fileType;
}
