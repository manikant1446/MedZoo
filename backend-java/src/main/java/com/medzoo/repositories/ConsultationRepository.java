package com.medzoo.repositories;

import com.medzoo.models.Consultation;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ConsultationRepository extends MongoRepository<Consultation, String> {
    List<Consultation> findByDoctorIdOrderByDateDesc(String doctorId);
    List<Consultation> findByPatientIdOrderByDateDesc(String patientId);
    List<Consultation> findByDoctorIdAndStatus(String doctorId, String status);
    List<Consultation> findByDoctorIdAndCategory(String doctorId, String category);
    long countByDoctorId(String doctorId);
}
