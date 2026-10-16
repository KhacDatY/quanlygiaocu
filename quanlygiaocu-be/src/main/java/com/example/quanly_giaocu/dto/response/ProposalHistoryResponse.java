package com.example.quanly_giaocu.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProposalHistoryResponse {
    private Long id;
    private String actionLabel; // VD: "Yêu cầu chỉnh sửa"
    private String actorName;   // VD: "Lê Hoàng Nam", nếu null trả về "Hệ thống"
    private String actorRole;   // VD: "Quản lý học vụ", nếu null trả về "Tự động chuyển tiếp"
    private String note;
    private LocalDateTime createdAt;
}
