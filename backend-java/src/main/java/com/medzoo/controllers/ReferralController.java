package com.medzoo.controllers;

import com.medzoo.models.Referral;
import com.medzoo.models.User;
import com.medzoo.repositories.ReferralRepository;
import com.medzoo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/referrals")
public class ReferralController {

    @Autowired private ReferralRepository referralRepository;
    @Autowired private UserRepository userRepository;

    /** POST /api/referrals — Create referral (doctor only) */
    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal User fromDoctor,
                                    @RequestBody Map<String, String> body) {
        if (!"doctor".equals(fromDoctor.getRole()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Doctor access required"));

        // Find target doctor by email or phone
        Optional<User> toDoctorOpt = Optional.empty();
        if (body.get("toDoctorEmail") != null) toDoctorOpt = userRepository.findByEmail(body.get("toDoctorEmail").toLowerCase());
        if (toDoctorOpt.isEmpty() && body.get("toDoctorPhone") != null)
            toDoctorOpt = userRepository.findByPhone(body.get("toDoctorPhone").trim());

        if (toDoctorOpt.isEmpty() || !"doctor".equals(toDoctorOpt.get().getRole()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Target doctor not found"));

        User toDoctor = toDoctorOpt.get();
        if (toDoctor.getId().equals(fromDoctor.getId()))
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot refer to yourself"));

        // Find patient by email or phone
        Optional<User> patientOpt = Optional.empty();
        if (body.get("patientEmail") != null) patientOpt = userRepository.findByEmail(body.get("patientEmail").toLowerCase());
        if (patientOpt.isEmpty() && body.get("patientPhone") != null)
            patientOpt = userRepository.findByPhone(body.get("patientPhone").trim());

        if (patientOpt.isEmpty() || !"patient".equals(patientOpt.get().getRole()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Patient not found"));

        Referral referral = new Referral();
        referral.setFromDoctorId(fromDoctor.getId());
        referral.setToDoctorId(toDoctor.getId());
        referral.setPatientId(patientOpt.get().getId());
        referral.setReason(body.get("reason"));
        referral.setNotes(body.getOrDefault("notes", ""));
        referral.setPriority(body.getOrDefault("priority", "medium"));

        return ResponseEntity.status(HttpStatus.CREATED).body(referralRepository.save(referral));
    }

    /** GET /api/referrals/incoming — Incoming referrals for doctor */
    @GetMapping("/incoming")
    public ResponseEntity<?> incoming(@AuthenticationPrincipal User doctor) {
        List<Referral> referrals = referralRepository.findByToDoctorIdOrderByCreatedAtDesc(doctor.getId());
        return ResponseEntity.ok(referrals);
    }

    /** GET /api/referrals/outgoing — Outgoing referrals for doctor */
    @GetMapping("/outgoing")
    public ResponseEntity<?> outgoing(@AuthenticationPrincipal User doctor) {
        List<Referral> referrals = referralRepository.findByFromDoctorIdOrderByCreatedAtDesc(doctor.getId());
        return ResponseEntity.ok(referrals);
    }

    /** PUT /api/referrals/{id}/accept */
    @PutMapping("/{id}/accept")
    public ResponseEntity<?> accept(@AuthenticationPrincipal User doctor, @PathVariable String id) {
        return updateStatus(doctor, id, "accepted", "pending");
    }

    /** PUT /api/referrals/{id}/decline */
    @PutMapping("/{id}/decline")
    public ResponseEntity<?> decline(@AuthenticationPrincipal User doctor, @PathVariable String id) {
        return updateStatus(doctor, id, "declined", "pending");
    }

    /** PUT /api/referrals/{id}/complete */
    @PutMapping("/{id}/complete")
    public ResponseEntity<?> complete(@AuthenticationPrincipal User doctor, @PathVariable String id) {
        return updateStatus(doctor, id, "completed", "accepted");
    }

    private ResponseEntity<?> updateStatus(User doctor, String id, String newStatus, String requiredStatus) {
        Referral r = referralRepository.findById(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        if (!r.getStatus().equals(requiredStatus))
            return ResponseEntity.badRequest().body(Map.of("message", "Referral not in required state"));
        boolean authorized = r.getToDoctorId().equals(doctor.getId()) || r.getFromDoctorId().equals(doctor.getId());
        if (!authorized)
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not authorized"));
        r.setStatus(newStatus);
        return ResponseEntity.ok(referralRepository.save(r));
    }
}
