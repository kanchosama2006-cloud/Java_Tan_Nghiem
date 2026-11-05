package com.example.caro.entity;

import jakarta.persistence.*;

/** Thong ke theo tai khoan, dung cho bang xep hang. */
@Entity
@Table(name = "scores")
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "games_played", nullable = false)
    private int gamesPlayed;

    @Column(name = "x_wins", nullable = false)
    private int xWins;

    @Column(name = "o_wins", nullable = false)
    private int oWins;

    @Column(nullable = false)
    private int draws;

    public Score() {
    }

    public Score(User user) {
        this.user = user;
    }

    /** delta = +1 khi them van, -1 khi xoa van. */
    public void apply(String winner, int delta) {
        gamesPlayed = Math.max(0, gamesPlayed + delta);
        switch (winner) {
            case "X" -> xWins = Math.max(0, xWins + delta);
            case "O" -> oWins = Math.max(0, oWins + delta);
            default -> draws = Math.max(0, draws + delta);
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public int getGamesPlayed() {
        return gamesPlayed;
    }

    public void setGamesPlayed(int gamesPlayed) {
        this.gamesPlayed = gamesPlayed;
    }

    public int getXWins() {
        return xWins;
    }

    public void setXWins(int xWins) {
        this.xWins = xWins;
    }

    public int getOWins() {
        return oWins;
    }

    public void setOWins(int oWins) {
        this.oWins = oWins;
    }

    public int getDraws() {
        return draws;
    }

    public void setDraws(int draws) {
        this.draws = draws;
    }
}
