package com.medzoo.controllers;

import com.medzoo.models.Appointment;
import com.medzoo.repositories.AppointmentRepository;
import com.medzoo.repositories.UserRepository;
import com.medzoo.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private UserRepository userRepository;

    private static final List<String> ALL_SLOTS = List.of(
        "09:00 AM","09:30 AM","10:00 AM","10:30 AM",
        "11:00 AM","11:30 AM","12:00 PM","12:30 PM",
        "01:00 PM","01:30 PM","02:00 PM","02:30 PM",
        "03:00 PM","03:30 PM","04:00 PM","04:30 PM"
    );

    private static final List<String> VALID_STATUSES = List.of(
        "pending","confirmed","in-progress","critical","completed","cancelled"
    );

    /** POST /api/appointments — Book an appointment (patient) */
    @PostMapping
    public ResponseEntity<?> bookAppointment(@AuthenticationPrincipal User patient,
                                              @RequestBody Map<String, Object> body) {
        String doctorId = (String) body.get("doctorId");
        String timeSlot = (String) body.get("timeSlot");
        String reason   = (String) body.getOrDefault("reason", "");
        String dateStr  = (String) body.get("date");

        if (doctorId == null || timeSlot == null || dateStr == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Doctor, date, and time slot are required"));

        User doctor = userRepository.findById(doctorId).orElse(null);
        if (doctor == null || !"doctor".equals(doctor.getRole()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor not found"));

        Instant date = LocalDate.parse(dateStr).atStartOfDay(ZoneId.of("UTC")).toInstant();
        Instant end  = date.plusSeconds(86400);

        // Check slot conflict
        boolean conflict = appointmentRepository
            .findByDoctorIdAndDateBetweenAndTimeSlotAndStatusIn(
                doctorId, date, end, timeSlot, List.of("pending","confirmed"))
            .isPresent();

        if (conflict)
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "This time slot is already booked"));

        Appointment appt = new Appointment();
        appt.setPatientId(patient.getId());
        appt.setDoctorId(doctorId);
        appt.setDate(date);
        appt.setTimeSlot(timeSlot);
        appt.setReason(reason);

        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentRepository.save(appt));
    }

    /** GET /api/appointments/patient — Patient's appointments */
    @GetMapping("/patient")
    public ResponseEntity<?> getPatientAppointments(@AuthenticationPrincipal User patient) {
        return ResponseEntity.ok(appointmentRepository.findByPatientIdOrderByDateDesc(patient.getId()));
    }

    /** GET /api/appointments/doctor — Doctor's appointments */
    @GetMapping("/doctor")
    public ResponseEntity<?> getDoctorAppointments(@AuthenticationPrincipal User doctor) {
        return ResponseEntity.ok(appointmentRepository.findByDoctorIdOrderByDateDesc(doctor.getId()));
    }

    /** GET /api/appointments/slots/{doctorId}/{date} — Available time slots */
    @GetMapping("/slots/{doctorId}/{date}")
    public ResponseEntity<?> getSlots(@PathVariable String doctorId, @PathVariable String date) {
        Instant start = LocalDate.parse(date).atStartOfDay(ZoneId.of("UTC")).toInstant();
        Instant end   = start.plusSeconds(86400);

        List<Appointment> booked = appointmentRepository.findByDoctorIdAndDateBetween(doctorId, start, end);
        Set<String> bookedSlots  = new HashSet<>();
        booked.stream()
              .filter(a -> List.of("pending","confirmed").contains(a.getStatus()))
              .forEach(a -> bookedSlots.add(a.getTimeSlot()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (String slot : ALL_SLOTS) {
            result.add(Map.of("time", slot, "available", !bookedSlots.contains(slot)));
        }
        return ResponseEntity.ok(result);
    }

    /** PUT /api/appointments/{id}/status — Update status */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@AuthenticationPrincipal User currentUser,
                                          @PathVariable String id,
                                          @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || !VALID_STATUSES.contains(status))
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status"));

        Appointment appt = appointmentRepository.findById(id).orElse(null);
        if (appt == null)
            return ResponseEntity.notFound().build();

        boolean isDoctor  = appt.getDoctorId().equals(currentUser.getId());
        boolean isPatient = appt.getPatientId().equals(currentUser.getId());

        if (!isDoctor && !isPatient)
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Not authorized"));

        if (isPatient && !isDoctor && !"cancelled".equals(status))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Patients can only cancel appointments"));

        appt.setStatus(status);
        return ResponseEntity.ok(appointmentRepository.save(appt));
    }
}
