package com.medzoo.repositories;

import com.medzoo.models.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByPatientIdOrderByDateDesc(String patientId);
    List<Appointment> findByDoctorIdOrderByDateDesc(String doctorId);
    List<Appointment> findByDoctorIdAndStatus(String doctorId, String status);
    List<Appointment> findByDoctorIdAndDateBetween(String doctorId, Instant start, Instant end);

    // For slot conflict check
    Optional<Appointment> findByDoctorIdAndDateBetweenAndTimeSlotAndStatusIn(
        String doctorId, Instant start, Instant end, String timeSlot, List<String> statuses
    );
}
