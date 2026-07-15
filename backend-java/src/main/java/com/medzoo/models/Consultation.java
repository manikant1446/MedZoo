package com.medzoo.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "consultations")
@CompoundIndex(def = "{'doctorId': 1, 'date': -1}")
@CompoundIndex(def = "{'doctorId': 1, 'status': 1}")
public class Consultation {

    @Id
    private String id;

    @Indexed
    private String patientId;

    @Indexed
    private String doctorId;

    /** Patient phone — mandatory for all consultations */
    private String patientPhone;

    private Instant date = Instant.now();

    private String diagnosis = "";

    /** pending | treated | referred | follow-up */
    private String status = "pending";

    /** Cardiology | Dermatology | Neurology | Orthopedics | Pediatrics | General | Oncology | Psychiatry | Other */
    private String category = "General";

    private String notes = "";

    private double rating = 0;

    private List<Prescription> prescriptions;

    private int consultationHour;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Data
    @NoArgsConstructor
    public static class Prescription {
        private String medicine;
        private String dosage;
        private String duration;
    }
}
