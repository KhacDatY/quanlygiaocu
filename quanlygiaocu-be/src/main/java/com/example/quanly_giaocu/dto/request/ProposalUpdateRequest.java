package com.example.quanly_giaocu.dto.request;

import com.example.quanly_giaocu.enums.Priority;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ProposalUpdateRequest {
    private String purpose;
    private LocalDate requiredDate;
    private Priority priority;

    // Lời nhắn giải trình khi sửa (Dành cho trường hợp gửi lại sau khi bị yêu cầu chỉnh sửa)
    private String editNote;

    @NotEmpty(message = "Danh sách giáo cụ không được rỗng")
    private List<ProposalItemRequest> items;

    private List<AttachmentRequest> attachments;
}