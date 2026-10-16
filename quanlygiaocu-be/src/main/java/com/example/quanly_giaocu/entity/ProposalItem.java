package com.example.quanly_giaocu.entity;

import com.example.quanly_giaocu.enums.EquipmentCategory;
import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "proposal_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProposalItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id")
    private Proposal proposal;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EquipmentCategory category;

    private Integer quantity;
    private String unit;
    private Double price;
}