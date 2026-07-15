package com.medzoo.controllers;

import com.medzoo.models.User;
import com.medzoo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    @Autowired private UserRepository userRepository;

    /** GET /api/doctors — List all doctors (for patient's "Discover" page) */
    @GetMapping
    public ResponseEntity<?> getAllDoctors(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String locality) {

        List<User> doctors;
        if (specialty != null && !specialty.isBlank()) {
            doctors = userRepository.findByRoleAndSpecialty("doctor", specialty);
        } else if (locality != null && !locality.isBlank()) {
            doctors = userRepository.findByRoleAndLocality("doctor", locality);
        } else {
            doctors = userRepository.findByRole("doctor");
        }

        // Strip sensitive fields
        List<Map<String, Object>> result = doctors.stream().map(d -> Map.<String, Object>of(
            "_id",           d.getId(),
            "name",          d.getName(),
            "email",         d.getEmail() != null ? d.getEmail() : "",
            "phone",         d.getPhone() != null ? d.getPhone() : "",
            "specialty",     d.getSpecialty(),
            "hospital",      d.getHospital(),
            "qualifications",d.getQualifications(),
            "experience",    d.getExperience(),
            "address",       d.getAddress(),
            "locality",      d.getLocality(),
            "rating",        d.getRating(),
            "ratingsCount",  d.getRatingsCount(),
            "avatar",        d.getAvatar(),
            "isVerified",    d.isVerified()
        )).toList();

        return ResponseEntity.ok(result);
    }

    /** GET /api/doctors/:id — Get single doctor details */
    @GetMapping("/{id}")
    public ResponseEntity<?> getDoctor(@PathVariable String id) {
        User doctor = userRepository.findById(id).orElse(null);
        if (doctor == null || !"doctor".equals(doctor.getRole()))
            return ResponseEntity.notFound().build();

        return ResponseEntity.ok(Map.of(
            "_id",           doctor.getId(),
            "name",          doctor.getName(),
            "email",         doctor.getEmail() != null ? doctor.getEmail() : "",
            "specialty",     doctor.getSpecialty(),
            "hospital",      doctor.getHospital(),
            "qualifications",doctor.getQualifications(),
            "experience",    doctor.getExperience(),
            "address",       doctor.getAddress(),
            "locality",      doctor.getLocality(),
            "rating",        doctor.getRating(),
            "ratingsCount",  doctor.getRatingsCount(),
            "avatar",        doctor.getAvatar(),
            "isVerified",    doctor.isVerified()
        ));
    }
}
