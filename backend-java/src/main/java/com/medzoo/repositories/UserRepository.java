package com.medzoo.repositories;

import com.medzoo.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByPhone(String phone);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneOrEmail(String phone, String email);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
    java.util.List<User> findByRole(String role);
    java.util.List<User> findByRoleAndSpecialty(String role, String specialty);
    java.util.List<User> findByRoleAndLocality(String role, String locality);
}
