package com.example.caro.service;

import com.example.caro.dto.CreateCommentRequest;
import com.example.caro.dto.GameCommentResponse;
import com.example.caro.dto.GameCommentSummaryResponse;
import com.example.caro.entity.Game;
import com.example.caro.entity.GameComment;
import com.example.caro.entity.User;
import com.example.caro.entity.UserInventory;
import com.example.caro.exception.ResourceNotFoundException;
import com.example.caro.repository.GameCommentRepository;
import com.example.caro.repository.GameRepository;
import com.example.caro.repository.UserInventoryRepository;
import com.example.caro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentService {

    private final GameCommentRepository gameCommentRepository;
    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final UserInventoryRepository userInventoryRepository;

    public CommentService(GameCommentRepository gameCommentRepository,
                          GameRepository gameRepository,
                          UserRepository userRepository,
                          UserInventoryRepository userInventoryRepository) {
        this.gameCommentRepository = gameCommentRepository;
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.userInventoryRepository = userInventoryRepository;
    }

    @Transactional(readOnly = true)
    public GameCommentSummaryResponse getCommentsForGame(Long gameId) {
        List<GameComment> list = gameCommentRepository.findByGameIdOrderByCreatedAtDesc(gameId);
        double avg = list.isEmpty() ? 0.0 : list.stream().mapToInt(GameComment::getRating).average().orElse(0.0);
        // Làm tròn 1 chữ số thập phân
        avg = Math.round(avg * 10.0) / 10.0;

        List<GameCommentResponse> dtos = list.stream().map(c -> {
            String frameClass = getEquippedFrame(c.getUser().getId());
            return GameCommentResponse.from(c, frameClass);
        }).toList();

        return new GameCommentSummaryResponse(avg, list.size(), dtos);
    }

    @Transactional
    public GameCommentResponse addComment(Long userId, Long gameId, CreateCommentRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ván cờ"));

        GameComment comment = new GameComment(game, user, req.rating(), req.content().trim());
        GameComment saved = gameCommentRepository.save(comment);

        String frameClass = getEquippedFrame(userId);
        return GameCommentResponse.from(saved, frameClass);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        GameComment comment = gameCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận"));
        gameCommentRepository.delete(comment);
    }

    private String getEquippedFrame(Long userId) {
        return userInventoryRepository.findByUserIdAndEquippedTrue(userId).stream()
                .filter(ui -> "AVATAR_FRAME".equalsIgnoreCase(ui.getItem().getCategory()))
                .map(ui -> ui.getItem().getCssClass())
                .findFirst()
                .orElse(null);
    }
}
