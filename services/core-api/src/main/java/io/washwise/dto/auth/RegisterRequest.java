package io.washwise.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Tenant name is required")
        @Size(min = 2, max = 100, message = "Tenant name must be between 2 and 100 characters")
        String tenantName,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        String password,

        @Size(max = 50)
        String firstName,

        @Size(max = 50)
        String lastName,

        @Size(max = 20)
        String phone
) {}
