package com.example.caro.entity;

import jakarta.persistence.*;

/** Mot nuoc di trong van dau. */
@Entity
@Table(name = "moves")
public class Move {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id")
    private Game game;

    /** Nuoc thu 1..9. */
    @Column(name = "move_order", nullable = false)
    private Integer moveOrder;

    @Column(name = "row_idx", nullable = false)
    private Integer rowIdx;

    @Column(name = "col_idx", nullable = false)
    private Integer colIdx;

    /** "X" hoac "O". */
    @Column(nullable = false, length = 1)
    private String symbol;

    public Move() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Game getGame() {
        return game;
    }

    public void setGame(Game game) {
        this.game = game;
    }

    public Integer getMoveOrder() {
        return moveOrder;
    }

    public void setMoveOrder(Integer moveOrder) {
        this.moveOrder = moveOrder;
    }

    public Integer getRowIdx() {
        return rowIdx;
    }

    public void setRowIdx(Integer rowIdx) {
        this.rowIdx = rowIdx;
    }

    public Integer getColIdx() {
        return colIdx;
    }

    public void setColIdx(Integer colIdx) {
        this.colIdx = colIdx;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }
}
