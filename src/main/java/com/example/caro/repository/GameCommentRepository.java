package com.example.caro.repository;

import com.example.caro.entity.GameComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameCommentRepository extends JpaRepository<GameComment, Long> {
    List<GameComment> findByGameIdOrderByCreatedAtDesc(Long gameId);
    List<GameComment> findAllByOrderByCreatedAtDesc();
}
