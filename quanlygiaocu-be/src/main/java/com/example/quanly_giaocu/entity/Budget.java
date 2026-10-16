package com.example.quanly_giaocu.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "group_budgets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int year;

    @Column(nullable = false)
    private int quarter;

    @Column(nullable = false)
    private Double allocatedAmount; // Ngân sách được cấp đầu quý
}