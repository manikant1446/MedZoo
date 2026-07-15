package com.medzoo.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@Document(collection = "referrals")
public class Referral {

    @Id
    private String id;

    @Indexed
    private String fromDoctorId;

    @Indexed
    private String toDoctorId;

    private String patientId;
    private String reason;
    private String notes = "";

    /** pending | accepted | declined | completed */
    private String status = "pending";

    /** low | medium | high | critical */
    private String priority = "medium";

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
