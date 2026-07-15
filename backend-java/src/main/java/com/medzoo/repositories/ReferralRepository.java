package com.medzoo.repositories;

import com.medzoo.models.Referral;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ReferralRepository extends MongoRepository<Referral, String> {
    List<Referral> findByToDoctorIdOrderByCreatedAtDesc(String toDoctorId);
    List<Referral> findByFromDoctorIdOrderByCreatedAtDesc(String fromDoctorId);
}
