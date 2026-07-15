package com.medzoo.dto;

import com.medzoo.models.User;
import lombok.Data;

@Data
public class AuthResponse {
    private String _id;
    private String phone;
    private String email;
    private String name;
    private String role;
    private String specialty;
    private String hospital;
    private String qualifications;
    private String avatar;
    private int    experience;
    private String address;
    private String locality;
    private double rating;
    private int    ratingsCount;
    private boolean isVerified;
    private String contactsPermissionStatus;
    private String token;

    public static AuthResponse from(User user, String token) {
        AuthResponse r = new AuthResponse();
        r._id                       = user.getId();
        r.phone                     = user.getPhone();
        r.email                     = user.getEmail();
        r.name                      = user.getName();
        r.role                      = user.getRole();
        r.specialty                 = user.getSpecialty();
        r.hospital                  = user.getHospital();
        r.qualifications            = user.getQualifications();
        r.avatar                    = user.getAvatar();
        r.experience                = user.getExperience();
        r.address                   = user.getAddress();
        r.locality                  = user.getLocality();
        r.rating                    = user.getRating();
        r.ratingsCount              = user.getRatingsCount();
        r.isVerified                = user.isVerified();
        r.contactsPermissionStatus  = user.getContactsPermissionStatus();
        r.token                     = token;
        return r;
    }
}
