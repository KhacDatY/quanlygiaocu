package com.example.quanly_giaocu.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProposalAttachmentResponse {
    private Long id;
    private String fileName;
    private String fileUrl;
    private String fileType;
}
