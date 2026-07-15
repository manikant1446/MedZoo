package com.medzoo.config;

import com.medzoo.models.Consultation;
import com.medzoo.models.User;
import com.medzoo.repositories.ConsultationRepository;
import com.medzoo.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Random;

@Slf4j
@Configuration
public class DataSeeder {

    @Autowired private UserRepository userRepository;
    @Autowired private ConsultationRepository consultationRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedData() {
        return args -> {
            // Only seed if no users exist
            if (userRepository.count() > 0) {
                log.info("Database already has data, skipping seed.");
                return;
            }

            log.info("Seeding demo data...");
            String encodedPassword = passwordEncoder.encode("password123");

            // Seed Doctor 1
            User doctor1 = new User();
            doctor1.setPhone("9000000001"); doctor1.setEmail("doctor@medzoo.com");
            doctor1.setName("Sarah Johnson"); doctor1.setPassword(encodedPassword);
            doctor1.setRole("doctor"); doctor1.setSpecialty("Cardiology");
            doctor1.setHospital("City Heart Center"); doctor1.setQualifications("MD, DM Cardiology");
            doctor1.setVerified(true);
            doctor1 = userRepository.save(doctor1);

            // Seed Doctor 2
            User doctor2 = new User();
            doctor2.setPhone("9000000002"); doctor2.setEmail("neurologist@medzoo.com");
            doctor2.setName("Michael Chen"); doctor2.setPassword(encodedPassword);
            doctor2.setRole("doctor"); doctor2.setSpecialty("Neurology");
            doctor2.setHospital("Metro Brain Institute"); doctor2.setQualifications("MD, DM Neurology");
            doctor2.setVerified(true);
            doctor2 = userRepository.save(doctor2);

            // Seed Patient 1
            User patient1 = new User();
            patient1.setPhone("9111111001"); patient1.setEmail("patient@medzoo.com");
            patient1.setName("Alex Thompson"); patient1.setPassword(encodedPassword);
            patient1.setRole("patient");
            patient1 = userRepository.save(patient1);

            // Seed Patient 2
            User patient2 = new User();
            patient2.setPhone("9111111002");
            patient2.setName("Priya Sharma"); patient2.setPassword(encodedPassword);
            patient2.setRole("patient");
            patient2 = userRepository.save(patient2);

            // Seed Patient 3
            User patient3 = new User();
            patient3.setPhone("9111111003");
            patient3.setName("Rahul Verma"); patient3.setPassword(encodedPassword);
            patient3.setRole("patient");
            patient3 = userRepository.save(patient3);

            // Seed consultations
            List<User> patients = List.of(patient1, patient2, patient3);
            List<User> doctors  = List.of(doctor1, doctor2);
            String[] phones    = {"9111111001","9111111002","9111111003"};
            String[] categories = {"Cardiology","General","Neurology","Dermatology","Orthopedics"};
            String[] statuses  = {"treated","treated","treated","pending","follow-up"};
            String[] diagnoses = {"Mild hypertension","Routine checkup","Tension headache",
                                  "Skin rash evaluation","Joint pain assessment"};
            Random rnd = new Random();

            for (int i = 0; i < 35; i++) {
                Consultation c = new Consultation();
                c.setPatientId(patients.get(i % patients.size()).getId());
                c.setDoctorId(doctors.get(i % doctors.size()).getId());
                c.setPatientPhone(phones[i % phones.length]);
                c.setDate(Instant.now().minus(rnd.nextInt(30), ChronoUnit.DAYS));
                c.setDiagnosis(diagnoses[i % diagnoses.length]);
                c.setStatus(statuses[i % statuses.length]);
                c.setCategory(categories[i % categories.length]);
                c.setNotes("Consultation note #" + (i + 1));
                c.setConsultationHour(8 + rnd.nextInt(10));
                consultationRepository.save(c);
            }

            log.info("✅ Demo data seeded:");
            log.info("   Doctors:  doctor@medzoo.com (📞 9000000001) | neurologist@medzoo.com (📞 9000000002)");
            log.info("   Patients: patient@medzoo.com (📞 9111111001) | 📞 9111111002 | 📞 9111111003");
            log.info("   Password: password123 (all accounts) — login by phone OR email");
        };
    }
}
