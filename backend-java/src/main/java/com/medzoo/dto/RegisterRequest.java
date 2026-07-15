package com.medzoo.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class RegisterRequest {
    @NotBlank(message = "Phone number is required")
    private String phone;

    private String email; // optional

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Role is required")
    private String role; // "patient" or "doctor"

    // Doctor-specific (optional)
    private String specialty;
    private String hospital;
    private String qualifications;
}
