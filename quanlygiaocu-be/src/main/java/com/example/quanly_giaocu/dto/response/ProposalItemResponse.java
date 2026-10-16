package com.example.quanly_giaocu.dto.response;

import com.example.quanly_giaocu.enums.EquipmentCategory;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProposalItemResponse {
    private Long id;
    private String name;
    private EquipmentCategory category;
    private Integer quantity;
    private String unit;
    private Double price;
}
