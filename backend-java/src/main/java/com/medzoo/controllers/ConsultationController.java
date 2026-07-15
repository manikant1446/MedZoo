package com.medzoo.controllers;

import com.medzoo.models.Consultation;
import com.medzoo.models.User;
import com.medzoo.repositories.ConsultationRepository;
import com.medzoo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

    @Autowired private ConsultationRepository consultationRepository;
    @Autowired private UserRepository userRepository;

    /** POST /api/consultations — Create consultation (doctor only) */
    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal User doctor,
                                    @RequestBody Map<String, Object> body) {
        if (!"doctor".equals(doctor.getRole()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Doctor access required"));

        String patientPhone = (String) body.get("patientPhone");
        if (patientPhone == null || patientPhone.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Patient phone number is required"));

        String patientEmail = (String) body.get("patientEmail");
        String patientName  = (String) body.get("patientName");

        // Find or auto-register patient
        Optional<User> patientOpt = Optional.empty();
        if (patientEmail != null && !patientEmail.isBlank())
            patientOpt = userRepository.findByEmail(patientEmail.toLowerCase().trim());
        if (patientOpt.isEmpty())
            patientOpt = userRepository.findByPhone(patientPhone.trim());

        User patient;
        if (patientOpt.isPresent()) {
            patient = patientOpt.get();
        } else {
            // Auto-register patient
            String name = patientName != null && !patientName.isBlank()
                    ? patientName.trim()
                    : "Patient_" + patientPhone;
            patient = new User();
            patient.setPhone(patientPhone.trim());
            patient.setEmail(patientEmail != null && !patientEmail.isBlank()
                    ? patientEmail.toLowerCase().trim() : null);
            patient.setName(name);
            patient.setRole("patient");
            patient.setPassword("$2a$12$dummyhash"); // placeholder
            patient = userRepository.save(patient);
        }

        Consultation c = new Consultation();
        c.setPatientId(patient.getId());
        c.setDoctorId(doctor.getId());
        c.setPatientPhone(patientPhone.trim());
        c.setDiagnosis((String) body.getOrDefault("diagnosis", ""));
        c.setStatus((String) body.getOrDefault("status", "pending"));
        c.setCategory((String) body.getOrDefault("category", "General"));
        c.setNotes((String) body.getOrDefault("notes", ""));
        c.setConsultationHour(Instant.now().atZone(ZoneId.systemDefault()).getHour());

        return ResponseEntity.status(HttpStatus.CREATED).body(consultationRepository.save(c));
    }

    /** GET /api/consultations/doctor — Doctor's consultations */
    @GetMapping("/doctor")
    public ResponseEntity<?> getDoctorConsultations(@AuthenticationPrincipal User doctor) {
        List<Consultation> list = consultationRepository.findByDoctorIdOrderByDateDesc(doctor.getId());
        return ResponseEntity.ok(list);
    }

    /** GET /api/consultations/patient — Patient's consultations */
    @GetMapping("/patient")
    public ResponseEntity<?> getPatientConsultations(@AuthenticationPrincipal User patient) {
        List<Consultation> list = consultationRepository.findByPatientIdOrderByDateDesc(patient.getId());
        return ResponseEntity.ok(list);
    }

    /** GET /api/consultations/analytics — Doctor analytics summary */
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(@AuthenticationPrincipal User doctor) {
        if (!"doctor".equals(doctor.getRole()))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        List<Consultation> all = consultationRepository.findByDoctorIdOrderByDateDesc(doctor.getId());
        long total   = all.size();
        long treated = all.stream().filter(c -> "treated".equals(c.getStatus())).count();
        long pending = all.stream().filter(c -> "pending".equals(c.getStatus())).count();

        return ResponseEntity.ok(Map.of(
            "total", total,
            "treated", treated,
            "pending", pending,
            "consultations", all
        ));
    }
}
