package com.medzoo.controllers;

import com.medzoo.dto.AuthResponse;
import com.medzoo.dto.LoginRequest;
import com.medzoo.dto.RegisterRequest;
import com.medzoo.middleware.JwtUtils;
import com.medzoo.models.User;
import com.medzoo.repositories.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private PasswordEncoder passwordEncoder;

    /**
     * POST /api/auth/register
     * Phone required, email optional
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        // Validate role
        if (!req.getRole().equals("patient") && !req.getRole().equals("doctor")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role must be patient or doctor"));
        }

        // Validate phone format (only digits, 10 to 15 digits)
        if (!req.getPhone().trim().matches("^[0-9]{10,15}$")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid phone number. It must contain only digits and be between 10 and 15 digits long."));
        }

        // Check phone uniqueness
        if (userRepository.existsByPhone(req.getPhone().trim())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "An account already exists with this phone number"));
        }

        // Check email uniqueness (only if email provided)
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            if (userRepository.existsByEmail(req.getEmail().toLowerCase().trim())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "An account already exists with this email address"));
            }
        }

        User user = new User();
        user.setPhone(req.getPhone().trim());
        user.setEmail(req.getEmail() != null && !req.getEmail().isBlank()
                ? req.getEmail().toLowerCase().trim() : null);
        user.setName(req.getName().trim());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(req.getRole());

        if ("doctor".equals(req.getRole())) {
            user.setSpecialty(req.getSpecialty() != null ? req.getSpecialty() : "");
            user.setHospital(req.getHospital() != null ? req.getHospital() : "");
            user.setQualifications(req.getQualifications() != null ? req.getQualifications() : "");
        }

        User saved = userRepository.save(user);
        String token = jwtUtils.generateToken(saved.getId(), saved.getPhone(), saved.getEmail(), saved.getRole());
        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(saved, token));
    }

    /**
     * POST /api/auth/login
     * Identifier can be phone number OR email
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        String id = req.getIdentifier().trim();
        boolean isPhone = id.matches("^[0-9+\\s\\-().]{7,15}$");

        Optional<User> userOpt = isPhone
                ? userRepository.findByPhone(id)
                : userRepository.findByEmail(id.toLowerCase());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "No account found with this phone/email"));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid phone/email or password"));
        }

        String token = jwtUtils.generateToken(user.getId(), user.getPhone(), user.getEmail(), user.getRole());
        return ResponseEntity.ok(AuthResponse.from(user, token));
    }

    /**
     * GET /api/auth/me
     * Return currently authenticated user
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(AuthResponse.from(user, null));
    }

    /**
     * PUT /api/auth/profile
     * Update profile: name, avatar, address, locality, experience, hospital, email
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal User currentUser,
                                           @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(currentUser.getId()).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        if (body.containsKey("name") && body.get("name") != null)
            user.setName(((String) body.get("name")).trim());

        if (body.containsKey("avatar"))
            user.setAvatar((String) body.get("avatar"));

        if (body.containsKey("address"))
            user.setAddress((String) body.get("address"));

        if (body.containsKey("locality"))
            user.setLocality((String) body.get("locality"));

        // Allow adding/updating email from profile
        if (body.containsKey("email")) {
            String newEmail = (String) body.get("email");
            if (newEmail != null && !newEmail.isBlank()) {
                newEmail = newEmail.toLowerCase().trim();
                // Check uniqueness
                String finalNewEmail = newEmail;
                Optional<User> conflict = userRepository.findByEmail(newEmail);
                if (conflict.isPresent() && !conflict.get().getId().equals(user.getId())) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "This email is already used by another account"));
                }
                user.setEmail(finalNewEmail);
            } else {
                user.setEmail(null);
            }
        }

        if ("doctor".equals(user.getRole())) {
            if (body.containsKey("experience") && body.get("experience") != null)
                user.setExperience(((Number) body.get("experience")).intValue());
            if (body.containsKey("hospital"))
                user.setHospital((String) body.get("hospital"));
        }

        User updated = userRepository.save(user);
        return ResponseEntity.ok(AuthResponse.from(updated, null));
    }
}
