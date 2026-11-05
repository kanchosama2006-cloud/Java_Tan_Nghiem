package com.example.caro.bot;

import com.example.caro.dto.BotMoveResponse;

import java.util.List;

/**
 * Tính Kế thừa (Inheritance) & Đa hình (Polymorphism):
 * MediumBotPlayer kế thừa từ AbstractBotPlayer.
 * Chiến thuật: Công Thủ Cơ Bản:
 * 1. Nếu có nước thắng ngay -> Đánh để thắng.
 * 2. Nếu đối thủ sắp thắng -> Đánh để chặn ngay.
 * 3. Nếu không, ưu tiên chiếm trung tâm bàn cờ hoặc đánh cạnh quân đối thủ.
 */
public class MediumBotPlayer extends AbstractBotPlayer {

    public MediumBotPlayer() {
        super("AI Chiến Binh (Vừa)", "MEDIUM");
    }

    @Override
    public BotMoveResponse calculateNextMove(BoardState state, char botSymbol) {
        char opponentSymbol = (botSymbol == 'X') ? 'O' : 'X';
        List<int[]> available = state.getAvailableMoves();

        if (available.isEmpty()) {
            return new BotMoveResponse(-1, -1, botName, difficultyLevel, "Bàn cờ đã đầy");
        }

        // 1. Tấn công: Tìm nước đi giúp Bot thắng ngay lập tức
        int[] winMove = findImmediateWinningMove(state, botSymbol);
        if (winMove != null) {
            return new BotMoveResponse(
                    winMove[0], winMove[1],
                    botName, difficultyLevel,
                    "Tìm thấy nước cờ kết liễu trận đấu!"
            );
        }

        // 2. Phòng thủ: Chặn ngay nếu đối thủ có nước thắng ở lượt tiếp theo
        int[] blockMove = findImmediateWinningMove(state, opponentSymbol);
        if (blockMove != null) {
            return new BotMoveResponse(
                    blockMove[0], blockMove[1],
                    botName, difficultyLevel,
                    "Phát hiện đối thủ sắp thắng, lập tức phòng thủ chặn đường!"
            );
        }

        // 3. Chiếm ô trung tâm nếu còn trống
        int center = state.getBoardSize() / 2;
        if (state.isCellEmpty(center, center)) {
            return new BotMoveResponse(
                    center, center,
                    botName, difficultyLevel,
                    "Chiếm lĩnh trung tâm bàn cờ để tạo lợi thế vị trí"
            );
        }

        // 4. Đánh vào ô có điểm đánh giá lân cận cao nhất
        int bestScore = -1;
        int[] bestMove = available.get(0);

        for (int[] move : available) {
            int score = countNeighbors(state, move[0], move[1]);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return new BotMoveResponse(
                bestMove[0], bestMove[1],
                botName, difficultyLevel,
                "Tạo thế liên kết quân cờ vững chắc"
        );
    }

    private int countNeighbors(BoardState state, int r, int c) {
        int count = 0;
        for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
                if (dr == 0 && dc == 0) continue;
                int nr = r + dr;
                int nc = c + dc;
                if (state.isValidCoord(nr, nc) && state.getCell(nr, nc) != ' ') {
                    count++;
                }
            }
        }
        return count;
    }
}
