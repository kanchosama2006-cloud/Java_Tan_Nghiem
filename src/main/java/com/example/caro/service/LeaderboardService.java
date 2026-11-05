package com.example.caro.service;

import com.example.caro.dto.LeaderboardRow;
import com.example.caro.dto.ScoreResponse;
import com.example.caro.repository.LeaderboardJdbcRepository;
import com.example.caro.repository.ScoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LeaderboardService {

    private final LeaderboardJdbcRepository jdbcRepository;   // JDBC
    private final ScoreRepository scoreRepository;            // JPA

    public LeaderboardService(LeaderboardJdbcRepository jdbcRepository, ScoreRepository scoreRepository) {
        this.jdbcRepository = jdbcRepository;
        this.scoreRepository = scoreRepository;
    }

    public List<LeaderboardRow> top10() {
        return jdbcRepository.top(10);
    }

    @Transactional(readOnly = true)
    public ScoreResponse myScore(Long userId) {
        return scoreRepository.findByUserId(userId).map(ScoreResponse::from).orElse(ScoreResponse.empty());
    }
}
