package com.example.caro.repository;

import com.example.caro.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ScoreRepository extends JpaRepository<Score, Long> {
    Optional<Score> findByUserId(Long userId);
}
