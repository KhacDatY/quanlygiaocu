package com.example.quanly_giaocu.entity;

import com.example.quanly_giaocu.enums.Priority;
import com.example.quanly_giaocu.enums.ProposalStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "proposals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Proposal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    private String code;
    private String purpose;
    private LocalDate requiredDate;
    @Enumerated(EnumType.STRING)
    private Priority priority;
    @Enumerated(EnumType.STRING)
    private ProposalStatus status;
    private Double estimatedTotal = 0.0;

    // --- Các trường do Phòng Hành chính nhập (Bước 5) ---
    private String supplierName;   // Nhà cung cấp
    private LocalDate orderDate;   // Ngày đặt hàng
    private LocalDate deliveryDate;// Ngày dự kiến giao
    private Double actualTotal;// Tổng tiền mua thực tế

    @OneToMany(mappedBy = "proposal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProposalItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "proposal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProposalAttachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "proposal", cascade = CascadeType.ALL)
    private List<ProposalHistory> histories =new ArrayList<>();
}