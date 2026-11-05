package com.example.caro.repository;

import com.example.caro.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findByUserIdOrderByStartedAtDesc(Long userId);

    List<Game> findAllByOrderByStartedAtDesc();

    long countByWinner(String winner);
}

