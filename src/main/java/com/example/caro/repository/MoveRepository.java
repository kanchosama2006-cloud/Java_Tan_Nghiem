package com.example.caro.repository;

import com.example.caro.entity.Move;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MoveRepository extends JpaRepository<Move, Long> {
}
