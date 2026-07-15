package com.medzoo.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@Document(collection = "appointments")
@CompoundIndex(def = "{'doctorId': 1, 'date': 1, 'timeSlot': 1}", unique = true)
public class Appointment {

    @Id
    private String id;

    private String patientId;
    private String doctorId;

    private Instant date;
    private String timeSlot;
    private String reason = "";

    /**
     * Status options:
     *   pending | confirmed | in-progress | critical | completed | cancelled
     * 'critical' triggers blinking red UI in frontend
     */
    private String status = "pending";

    private String notes = "";
    private double rating = 0;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
