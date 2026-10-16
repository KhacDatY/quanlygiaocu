package com.example.quanly_giaocu.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCreationRequest{
    @Size(min = 3, message = "INVALID_USERNAME")
    private String username;

    @Size(min = 8, message = "INVALID_PASSWORD")
    private String password;

    private String fullName;

    private String role;

    private UUID groupId;

    @Email(message = "INVALID_EMAIL")
    private String email;
}