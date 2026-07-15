package com.medzoo.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "users")
public class User implements UserDetails {

    @Id
    private String id;

    /** Phone number — primary login identifier (required) */
    @Indexed(unique = true, sparse = true)
    private String phone;

    /** Email — optional, can be added later from profile */
    @Indexed(unique = true, sparse = true)
    private String email;

    private String password;

    private String name;

    /** "patient" or "doctor" */
    private String role;

    // Doctor-specific fields
    private String specialty = "";
    private String hospital  = "";
    private String qualifications = "";
    private int    experience = 0;
    private String address  = "";
    private String locality = "";
    private double rating   = 5.0;
    private int    ratingsCount = 0;
    private boolean isVerified = false;

    // Common
    private String avatar = "";
    private String contactsPermissionStatus = "prompt"; // prompt | granted | denied

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    // ===== Spring Security UserDetails implementation =====

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
    }

    @Override
    public String getUsername() {
        // Use phone as primary username; fall back to email
        return phone != null ? phone : email;
    }

    @Override
    public boolean isAccountNonExpired()    { return true; }
    @Override
    public boolean isAccountNonLocked()     { return true; }
    @Override
    public boolean isCredentialsNonExpired(){ return true; }
    @Override
    public boolean isEnabled()              { return true; }
}
