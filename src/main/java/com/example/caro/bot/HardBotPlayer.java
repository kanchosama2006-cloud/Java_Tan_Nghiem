package com.example.caro.bot;

import com.example.caro.dto.BotMoveResponse;

import java.util.ArrayList;
import java.util.List;

/**
 * Tính Kế thừa (Inheritance) & Đa hình (Polymorphism):
 * HardBotPlayer kế thừa từ AbstractBotPlayer.
 * Chiến thuật:
 * - Với bàn 3x3: Thuật toán Minimax (kết hợp cắt tỉa Alpha-Beta), tính toán tối ưu toàn bộ cây trò chơi.
 * - Với bàn 5x5 và 10x10: Ma trận Heuristic chấm điểm chuỗi liên tiếp (Attack/Defense weight matrix),
 *   tìm kiếm nước đi tối ưu nhất trong thời gian cực nhanh (< 50ms).
 */
public class HardBotPlayer extends AbstractBotPlayer {

    public HardBotPlayer() {
        super("AI Đại Kiện Tướng (Khó)", "HARD");
    }

    @Override
    public BotMoveResponse calculateNextMove(BoardState state, char botSymbol) {
        char opponent = (botSymbol == 'X') ? 'O' : 'X';
        List<int[]> available = state.getAvailableMoves();

        if (available.isEmpty()) {
            return new BotMoveResponse(-1, -1, botName, difficultyLevel, "Bàn cờ đã đầy");
        }

        // 1. Thắng ngay
        int[] winMove = findImmediateWinningMove(state, botSymbol);
        if (winMove != null) {
            return new BotMoveResponse(winMove[0], winMove[1], botName, difficultyLevel, "Nước đi dứt điểm giành chiến thắng tuyệt đối!");
        }

        // 2. Chặn thua ngay
        int[] blockMove = findImmediateWinningMove(state, opponent);
        if (blockMove != null) {
            return new BotMoveResponse(blockMove[0], blockMove[1], botName, difficultyLevel, "Chặn đứng hiểm họa chiến thắng của đối phương!");
        }

        // 3. Nếu là bàn 3x3 Cổ điển -> Dùng thuật toán Minimax Alpha-Beta hoàn hảo
        if (state.getBoardSize() == 3 && !state.isInfiniteMode()) {
            int bestVal = Integer.MIN_VALUE;
            int[] bestMove = available.get(0);

            for (int[] move : available) {
                BoardState next = state.copy();
                next.makeMove(move[0], move[1], botSymbol);
                int moveVal = minimax(next, 0, false, Integer.MIN_VALUE, Integer.MAX_VALUE, botSymbol, opponent);
                if (moveVal > bestVal) {
                    bestVal = moveVal;
                    bestMove = move;
                }
            }
            return new BotMoveResponse(bestMove[0], bestMove[1], botName, difficultyLevel, "Tính toán Minimax dự đoán toàn bộ nước đi");
        }

        // 4. Nếu là bàn 3x3 Vô tận hoặc bàn 5x5, 10x10 -> Dùng Heuristic Matrix cực nhanh và thông minh
        int[] bestMove = findBestHeuristicMove(state, botSymbol, opponent);
        return new BotMoveResponse(bestMove[0], bestMove[1], botName, difficultyLevel, "Phân tích thế trận bằng ma trận điểm Heuristic nâng cao");
    }

    private int minimax(BoardState state, int depth, boolean isMax, int alpha, int beta, char bot, char opponent) {
        char winner = state.checkWinner();
        if (winner == bot) return 10 - depth;
        if (winner == opponent) return depth - 10;
        if (winner == 'D' || depth >= 6) return 0;

        List<int[]> moves = state.getAvailableMoves();
        if (moves.isEmpty()) return 0;

        if (isMax) {
            int maxEval = Integer.MIN_VALUE;
            for (int[] m : moves) {
                BoardState next = state.copy();
                next.makeMove(m[0], m[1], bot);
                int eval = minimax(next, depth + 1, false, alpha, beta, bot, opponent);
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) break; // Cắt tỉa Alpha-Beta
            }
            return maxEval;
        } else {
            int minEval = Integer.MAX_VALUE;
            for (int[] m : moves) {
                BoardState next = state.copy();
                next.makeMove(m[0], m[1], opponent);
                int eval = minimax(next, depth + 1, true, alpha, beta, bot, opponent);
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) break; // Cắt tỉa Alpha-Beta
            }
            return minEval;
        }
    }

    private int[] findBestHeuristicMove(BoardState state, char bot, char opponent) {
        List<int[]> available = state.getAvailableMoves();
        int bestScore = Integer.MIN_VALUE;
        int[] bestMove = available.get(0);

        // Giới hạn ô xét duyệt gần các quân cờ đang có để tối ưu tốc độ
        List<int[]> candidates = new ArrayList<>();
        for (int[] m : available) {
            if (hasNearbyPiece(state, m[0], m[1], 2)) {
                candidates.add(m);
            }
        }
        if (candidates.isEmpty()) candidates = available;

        for (int[] m : candidates) {
            int attackScore = evaluateSpot(state, m[0], m[1], bot);
            int defenseScore = evaluateSpot(state, m[0], m[1], opponent);

            // Phòng thủ được nhân trọng số 1.25 để ưu tiên triệt tiêu nguy hiểm
            int totalScore = attackScore + (int)(defenseScore * 1.25);

            // Ưu tiên ô gần tâm bàn cờ
            int center = state.getBoardSize() / 2;
            int distToCenter = Math.abs(m[0] - center) + Math.abs(m[1] - center);
            totalScore -= distToCenter * 2;

            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMove = m;
            }
        }
        return bestMove;
    }

    private boolean hasNearbyPiece(BoardState state, int r, int c, int radius) {
        for (int dr = -radius; dr <= radius; dr++) {
            for (int dc = -radius; dc <= radius; dc++) {
                if (dr == 0 && dc == 0) continue;
                int nr = r + dr;
                int nc = c + dc;
                if (state.isValidCoord(nr, nc) && state.getCell(nr, nc) != ' ') {
                    return true;
                }
            }
        }
        return false;
    }

    private int evaluateSpot(BoardState state, int r, int c, char symbol) {
        int score = 0;
        int[][] dirs = {{0, 1}, {1, 0}, {1, 1}, {1, -1}};

        for (int[] d : dirs) {
            int count = 1; // bản thân ô đang xét
            int openEnds = 0;

            // Tiến theo hướng
            int step = 1;
            while (true) {
                int nr = r + d[0] * step;
                int nc = c + d[1] * step;
                if (!state.isValidCoord(nr, nc)) break;
                if (state.getCell(nr, nc) == symbol) {
                    count++;
                    step++;
                } else if (state.getCell(nr, nc) == ' ') {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }

            // Lùi theo hướng ngược lại
            step = 1;
            while (true) {
                int nr = r - d[0] * step;
                int nc = c - d[1] * step;
                if (!state.isValidCoord(nr, nc)) break;
                if (state.getCell(nr, nc) == symbol) {
                    count++;
                    step++;
                } else if (state.getCell(nr, nc) == ' ') {
                    openEnds++;
                    break;
                } else {
                    break;
                }
            }

            int req = state.getWinCondition();
            if (count >= req) {
                score += 100000;
            } else if (count == req - 1) {
                score += (openEnds == 2) ? 10000 : 2000;
            } else if (count == req - 2) {
                score += (openEnds == 2) ? 1500 : 250;
            } else {
                score += count * 10;
            }
        }
        return score;
    }
}
