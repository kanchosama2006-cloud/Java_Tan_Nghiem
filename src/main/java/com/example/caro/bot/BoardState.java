package com.example.caro.bot;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Queue;

/**
 * Thể hiện Tính Đóng gói (Encapsulation) trong OOP:
 * Trạng thái bàn cờ với các trường dữ liệu đều private,
 * chỉ tương tác thông qua các phương thức public được kiểm soát chặt chẽ.
 */
public class BoardState {

    private final int boardSize;       // 3, 5, hoặc 10
    private final int winCondition;    // 3 cho bàn 3x3; 4 cho bàn 5x5; 5 cho bàn 10x10
    private final boolean infiniteMode; // chỉ bật khi boardSize == 3 và chơi luật vô tận
    private final char[][] grid;
    private final Queue<int[]> xQueue;
    private final Queue<int[]> oQueue;

    public BoardState(int boardSize, boolean infiniteMode) {
        this.boardSize = boardSize;
        this.winCondition = (boardSize == 3) ? 3 : (boardSize == 5 ? 4 : 5);
        this.infiniteMode = (boardSize == 3) && infiniteMode;
        this.grid = new char[boardSize][boardSize];
        for (int r = 0; r < boardSize; r++) {
            for (int c = 0; c < boardSize; c++) {
                grid[r][c] = ' ';
            }
        }
        this.xQueue = new ArrayDeque<>();
        this.oQueue = new ArrayDeque<>();
    }

    public int getBoardSize() {
        return boardSize;
    }

    public int getWinCondition() {
        return winCondition;
    }

    public boolean isInfiniteMode() {
        return infiniteMode;
    }

    public char getCell(int r, int c) {
        if (isValidCoord(r, c)) {
            return grid[r][c];
        }
        return ' ';
    }

    public boolean isValidCoord(int r, int c) {
        return r >= 0 && r < boardSize && c >= 0 && c < boardSize;
    }

    public boolean isCellEmpty(int r, int c) {
        return isValidCoord(r, c) && grid[r][c] == ' ';
    }

    /**
     * Thực hiện một nước đi trên bàn cờ.
     * Nếu ở chế độ Vô tận và bên đánh đã có 3 quân, quân cũ nhất sẽ bị xóa.
     * @return tọa độ quân bị xóa [r, c] nếu có, ngược lại null.
     */
    public int[] makeMove(int r, int c, char symbol) {
        if (!isCellEmpty(r, c)) {
            return null;
        }

        int[] removed = null;
        if (infiniteMode) {
            Queue<int[]> queue = (symbol == 'X') ? xQueue : oQueue;
            if (queue.size() >= 3) {
                removed = queue.poll();
                grid[removed[0]][removed[1]] = ' ';
            }
            queue.add(new int[]{r, c});
        }

        grid[r][c] = symbol;
        return removed;
    }

    public void undoMove(int r, int c, int[] restored) {
        if (isValidCoord(r, c)) {
            char symbol = grid[r][c];
            grid[r][c] = ' ';

            if (infiniteMode) {
                Queue<int[]> queue = (symbol == 'X') ? xQueue : oQueue;
                // Xóa nước vừa thêm (ở cuối queue)
                List<int[]> list = new ArrayList<>(queue);
                if (!list.isEmpty()) {
                    list.remove(list.size() - 1);
                }
                // Nếu có nước bị xóa trước đó thì phục hồi lại đầu queue
                if (restored != null) {
                    list.add(0, restored);
                    grid[restored[0]][restored[1]] = symbol;
                }
                queue.clear();
                queue.addAll(list);
            }
        }
    }

    public List<int[]> getAvailableMoves() {
        List<int[]> moves = new ArrayList<>();
        for (int r = 0; r < boardSize; r++) {
            for (int c = 0; c < boardSize; c++) {
                if (grid[r][c] == ' ') {
                    moves.add(new int[]{r, c});
                }
            }
        }
        return moves;
    }

    /**
     * Kiểm tra người chiến thắng ('X', 'O', 'D' nếu hòa, ' ' nếu chưa kết thúc).
     */
    public char checkWinner() {
        int[][] directions = {{0, 1}, {1, 0}, {1, 1}, {1, -1}};

        for (int r = 0; r < boardSize; r++) {
            for (int c = 0; c < boardSize; c++) {
                char s = grid[r][c];
                if (s == ' ') continue;

                for (int[] d : directions) {
                    int dr = d[0];
                    int dc = d[1];
                    boolean win = true;

                    for (int step = 1; step < winCondition; step++) {
                        int nr = r + dr * step;
                        int nc = c + dc * step;
                        if (!isValidCoord(nr, nc) || grid[nr][nc] != s) {
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

        if (!infiniteMode && getAvailableMoves().isEmpty()) {
            return 'D'; // Draw
        }

        return ' ';
    }

    /** Bản sao bàn cờ phục vụ thuật toán tìm kiếm Minimax */
    public BoardState copy() {
        BoardState copy = new BoardState(this.boardSize, this.infiniteMode);
        for (int r = 0; r < boardSize; r++) {
            System.arraycopy(this.grid[r], 0, copy.grid[r], 0, boardSize);
        }
        for (int[] p : this.xQueue) {
            copy.xQueue.add(new int[]{p[0], p[1]});
        }
        for (int[] p : this.oQueue) {
            copy.oQueue.add(new int[]{p[0], p[1]});
        }
        return copy;
    }
}
