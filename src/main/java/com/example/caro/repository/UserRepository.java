package com.example.caro.repository;

import com.example.caro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<User> findByGoogleId(String googleId);

    Optional<User> findByEmail(String email);
}
