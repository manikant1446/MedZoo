package com.medzoo.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class LoginRequest {
    /** Can be phone number OR email address */
    @NotBlank(message = "Phone/email identifier is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;
}
