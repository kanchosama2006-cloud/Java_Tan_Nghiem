package com.example.caro.bot;

import com.example.caro.dto.BotMoveRequest;
import com.example.caro.dto.BotMoveResponse;
import com.example.caro.dto.MoveDto;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service điều phối Bot:
 * Thể hiện Tính Đa hình (Polymorphism) thông qua con trỏ AbstractBotPlayer
 * nhận bất kỳ instance con nào (EasyBotPlayer, MediumBotPlayer, HardBotPlayer)
 * mà không cần quan tâm chi tiết cài đặt bên dưới.
 */
@Service
public class BotService {

    public AbstractBotPlayer getBotByDifficulty(String difficulty) {
        if (difficulty == null) difficulty = "MEDIUM";
        return switch (difficulty.toUpperCase()) {
            case "EASY" -> new EasyBotPlayer();
            case "HARD" -> new HardBotPlayer();
            default -> new MediumBotPlayer();
        };
    }

    public BotMoveResponse getNextMove(BotMoveRequest req) {
        int size = (req.boardSize() != null && (req.boardSize() == 5 || req.boardSize() == 10))
                ? req.boardSize() : 3;
        boolean infinite = (size == 3) && "INFINITE".equalsIgnoreCase(req.mode());

        // 1. Tái hiện lại trạng thái bàn cờ hiện tại
        BoardState state = new BoardState(size, infinite);
        List<MoveDto> moves = req.moves();

        if (moves != null) {
            for (MoveDto m : moves) {
                state.makeMove(m.row(), m.col(), m.symbol().charAt(0));
            }
        }

        // 2. Sử dụng tính Đa hình (Polymorphism):
        // Kiểu khai báo là AbstractBotPlayer nhưng hành vi phụ thuộc vào instance cụ thể
        AbstractBotPlayer bot = getBotByDifficulty(req.difficulty());

        // Lượt của Bot mặc định là O (người chơi đi trước là X)
        return bot.calculateNextMove(state, 'O');
    }
}
