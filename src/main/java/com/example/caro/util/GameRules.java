package com.example.caro.util;

import com.example.caro.dto.MoveDto;
import com.example.caro.exception.BadRequestException;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;

/**
 * Luat choi Caro da kich thuoc (3x3, 5x5, 10x10) va da che do (Co dien & Vo tan FIFO 3x3).
 * Server kiem tra lai toan bo danh sach nuoc di de xac dinh nguoi chien thang.
 */
public final class GameRules {

    private GameRules() {
    }

    /**
     * Tự động xác định kích thước bàn cờ dựa vào tọa độ row/col lớn nhất của các nước đi.
     * Mặc định là 3x3. Nếu có ô >= 5 -> 10x10. Nếu có ô >= 3 -> 5x5.
     */
    public static int detectBoardSize(List<MoveDto> moves) {
        int maxCoord = 0;
        for (MoveDto m : moves) {
            maxCoord = Math.max(maxCoord, Math.max(m.row(), m.col()));
        }
        if (maxCoord >= 5) return 10;
        if (maxCoord >= 3) return 5;
        return 3;
    }

    /**
     * Tra ve "X", "O" hoac "DRAW"; nem BadRequestException neu van khong hop le.
     */
    public static String evaluate(List<MoveDto> moves) {
        if (moves == null || moves.isEmpty()) {
            throw new BadRequestException("Danh sách nước đi không được rỗng");
        }

        int size = detectBoardSize(moves);

        // 1. Neu la ban 3x3, thu danh gia theo luat co dien hoac vo tan
        if (size == 3) {
            try {
                return evaluateClassic(moves, 3, 3);
            } catch (BadRequestException e) {
                return evaluateInfinite3x3(moves);
            }
        }

        // 2. Ban 5x5 (can 4 quan thang) hoac 10x10 (can 5 quan thang)
        int winCondition = (size == 5) ? 4 : 5;
        return evaluateClassic(moves, size, winCondition);
    }

    /** Luat Co dien tren ban kich thuoc size * size voi dieu kien winCondition quan thang */
    public static String evaluateClassic(List<MoveDto> moves, int size, int winCondition) {
        String[][] board = new String[size][size];
        String winner = null;

        for (int i = 0; i < moves.size(); i++) {
            MoveDto m = moves.get(i);
            String expected = (i % 2 == 0) ? "X" : "O";

            if (winner != null) {
                throw new BadRequestException("Có nước đi sau khi ván đã kết thúc (nước thứ " + (i + 1) + ")");
            }
            if (!expected.equals(m.symbol())) {
                throw new BadRequestException("Sai lượt đi ở nước thứ " + (i + 1) + ": phải là " + expected);
            }
            if (m.row() < 0 || m.row() >= size || m.col() < 0 || m.col() >= size) {
                throw new BadRequestException("Tọa độ nước đi vượt ngoài kích thước bàn cờ");
            }
            if (board[m.row()][m.col()] != null) {
                throw new BadRequestException("Ô đã có quân ở nước thứ " + (i + 1));
            }

            board[m.row()][m.col()] = m.symbol();
            winner = checkWinner(board, size, winCondition);
        }

        if (winner != null) {
            return winner;
        }

        if (moves.size() == size * size) {
            return "DRAW";
        }

        throw new BadRequestException("Ván cờ chưa kết thúc nên không thể lưu");
    }

    /** Luat Vo tan FIFO danh rieng cho ban 3x3 */
    public static String evaluateInfinite3x3(List<MoveDto> moves) {
        String[][] board = new String[3][3];
        Deque<int[]> queueX = new ArrayDeque<>();
        Deque<int[]> queueO = new ArrayDeque<>();
        String winner = null;

        for (int i = 0; i < moves.size(); i++) {
            MoveDto m = moves.get(i);
            String expected = (i % 2 == 0) ? "X" : "O";

            if (winner != null) {
                throw new BadRequestException("Có nước đi sau khi ván đã kết thúc (nước thứ " + (i + 1) + ")");
            }
            if (!expected.equals(m.symbol())) {
                throw new BadRequestException("Sai lượt đi ở nước thứ " + (i + 1) + ": phải là " + expected);
            }

            Deque<int[]> myQueue = "X".equals(expected) ? queueX : queueO;

            if (myQueue.size() >= 3) {
                int[] removed = myQueue.pollFirst();
                board[removed[0]][removed[1]] = null;
            }

            if (board[m.row()][m.col()] != null) {
                throw new BadRequestException("Ô đã có quân ở nước thứ " + (i + 1));
            }

            board[m.row()][m.col()] = m.symbol();
            myQueue.addLast(new int[]{m.row(), m.col()});

            winner = checkWinner(board, 3, 3);
        }

        if (winner != null) {
            return winner;
        }

        throw new BadRequestException("Ván cờ vô tận chưa tìm được người thắng");
    }

    private static String checkWinner(String[][] b, int size, int winCondition) {
        int[][] directions = {{0, 1}, {1, 0}, {1, 1}, {1, -1}};

        for (int r = 0; r < size; r++) {
            for (int c = 0; c < size; c++) {
                String s = b[r][c];
                if (s == null) continue;

                for (int[] d : directions) {
                    int dr = d[0];
                    int dc = d[1];
                    boolean win = true;

                    for (int step = 1; step < winCondition; step++) {
                        int nr = r + dr * step;
                        int nc = c + dc * step;
                        if (nr < 0 || nr >= size || nc < 0 || nc >= size || !s.equals(b[nr][nc])) {
                            win = false;
                            break;
                        }
                    }

                    if (win) {
                        return s;
                    }
                }
            }
        }
        return null;
    }
}
