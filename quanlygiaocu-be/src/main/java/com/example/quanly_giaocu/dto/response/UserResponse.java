package com.example.quanly_giaocu.dto.response;

import lombok.*;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String email;
    private String role;

    private String position;
    private String groupName;
}