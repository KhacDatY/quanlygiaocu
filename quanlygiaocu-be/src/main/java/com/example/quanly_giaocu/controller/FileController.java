package com.example.quanly_giaocu.controller;

import com.example.quanly_giaocu.dto.request.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/files")
public class FileController {

    @Value("${upload.path}")
    private String uploadPath;

    @PostMapping("/upload")
    public ApiResponse<String> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // Tạo thư mục nếu chưa có
            File directory = new File(uploadPath);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Tạo tên file duy nhất tránh trùng lặp
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFileName = UUID.randomUUID().toString() + extension;

            // Lưu file
            Path filePath = Paths.get(uploadPath, newFileName);
            Files.write(filePath, file.getBytes());

            // Trả về URL để FE gọi (khớp với cấu hình WebConfig của bạn)
            String fileUrl = "/uploads/" + newFileName;

            return ApiResponse.<String>builder()
                    .result(fileUrl)
                    .message("Upload thành công")
                    .build();

        } catch (IOException e) {
            throw new RuntimeException("Lỗi lưu file", e);
        }
    }
}