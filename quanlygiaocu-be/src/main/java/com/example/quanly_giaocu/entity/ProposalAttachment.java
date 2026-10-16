package com.example.quanly_giaocu.entity;
import com.example.quanly_giaocu.enums.AttachmentType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "proposal_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProposalAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id")
    private Proposal proposal;

    private String fileName;
    private String fileUrl;
    private String fileType;

    @Enumerated(EnumType.STRING)
    private AttachmentType type;
}