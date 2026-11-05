package com.example.caro.repository;

import com.example.caro.dto.LeaderboardRow;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Truy van thong ke bang JDBC (JdbcTemplate): gop 2 bang scores va users,
 * sap xep va gioi han so dong. Day la cho dung JDBC (con CRUD dung JPA).
 */
@Repository
public class LeaderboardJdbcRepository {

    private static final String SQL = """
            SELECT u.username, u.full_name, s.games_played, s.x_wins, s.o_wins, s.draws
            FROM scores s
            JOIN users u ON u.id = s.user_id
            WHERE s.games_played > 0
            ORDER BY s.games_played DESC, u.username ASC
            LIMIT ?
            """;

    private final JdbcTemplate jdbcTemplate;

    public LeaderboardJdbcRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<LeaderboardRow> top(int limit) {
        return jdbcTemplate.query(SQL, (rs, rowNum) -> new LeaderboardRow(
                rowNum + 1,
                rs.getString("username"),
                rs.getString("full_name"),
                rs.getInt("games_played"),
                rs.getInt("x_wins"),
                rs.getInt("o_wins"),
                rs.getInt("draws")), limit);
    }
}
