package com.example.quanly_giaocu.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupResponse {
    private UUID id;
    private String name;
    private BigDecimal fundBalance;
}