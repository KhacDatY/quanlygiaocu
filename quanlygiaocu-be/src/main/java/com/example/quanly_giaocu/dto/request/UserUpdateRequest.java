package com.example.quanly_giaocu.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateRequest {
    private String fullName;
    private String email;
    private String position;

    private String password;
}