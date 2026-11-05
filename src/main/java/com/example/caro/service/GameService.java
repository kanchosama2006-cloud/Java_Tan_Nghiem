package com.example.caro.service;

import com.example.caro.dto.GameRequest;
import com.example.caro.dto.GameResponse;
import com.example.caro.dto.GameUpdateRequest;
import com.example.caro.dto.MoveDto;
import com.example.caro.entity.Game;
import com.example.caro.entity.Move;
import com.example.caro.entity.Score;
import com.example.caro.entity.User;
import com.example.caro.exception.ForbiddenException;
import com.example.caro.exception.ResourceNotFoundException;
import com.example.caro.repository.GameRepository;
import com.example.caro.repository.ScoreRepository;
import com.example.caro.repository.UserRepository;
import com.example.caro.util.GameRules;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Nghiep vu van dau: luu, xem, sua ten, xoa va cap nhat thong ke. */
@Service
public class GameService {

    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final ScoreRepository scoreRepository;
    private final RewardService rewardService;

    public GameService(GameRepository gameRepository, UserRepository userRepository,
                       ScoreRepository scoreRepository, RewardService rewardService) {
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.scoreRepository = scoreRepository;
        this.rewardService = rewardService;
    }

    @Transactional
    public GameResponse save(Long userId, GameRequest req) {
        String winner = GameRules.evaluate(req.moves());   // kiem tra luat + tinh ket qua

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Game game = new Game();
        game.setUser(user);
        game.setPlayerX(req.playerX().trim());
        game.setPlayerO(req.playerO().trim());
        game.setWinner(winner);
        game.setStartedAt(LocalDateTime.now());
        game.setFinishedAt(LocalDateTime.now());

        List<MoveDto> moves = req.moves();
        for (int i = 0; i < moves.size(); i++) {
            Move m = new Move();
            m.setMoveOrder(i + 1);
            m.setRowIdx(moves.get(i).row());
            m.setColIdx(moves.get(i).col());
            m.setSymbol(moves.get(i).symbol());
            game.addMove(m);
        }
        gameRepository.save(game);

        Score score = scoreRepository.findByUserId(userId).orElseGet(() -> new Score(user));
        score.apply(winner, +1);
        scoreRepository.save(score);

        // Tu dong thuong Xu va kiem tra mo khoa thanh tuu
        boolean isBot = req.playerO().contains("AI") || req.playerO().contains("Máy");
        boolean isHardBot = req.playerO().contains("Đại Kiện Tướng") || req.playerO().contains("Khó");
        boolean isOnline = req.playerO().contains("(Online)");
        rewardService.processGameReward(userId, winner, isBot, isHardBot, isOnline);

        return GameResponse.detail(game);
    }

    @Transactional(readOnly = true)
    public List<GameResponse> list(Long userId, boolean admin) {
        List<Game> games = admin
                ? gameRepository.findAllByOrderByStartedAtDesc()
                : gameRepository.findByUserIdOrderByStartedAtDesc(userId);
        return games.stream().map(GameResponse::summary).toList();
    }

    @Transactional(readOnly = true)
    public GameResponse get(Long id, Long userId, boolean admin) {
        return GameResponse.detail(findAllowed(id, userId, admin));
    }

    @Transactional
    public GameResponse updateNames(Long id, Long userId, boolean admin, GameUpdateRequest req) {
        Game game = findAllowed(id, userId, admin);
        game.setPlayerX(req.playerX().trim());
        game.setPlayerO(req.playerO().trim());
        return GameResponse.detail(gameRepository.save(game));
    }

    @Transactional
    public void delete(Long id, Long userId, boolean admin) {
        Game game = findAllowed(id, userId, admin);
        // tru thong ke cua chu van dau
        scoreRepository.findByUserId(game.getUser().getId()).ifPresent(s -> {
            s.apply(game.getWinner(), -1);
            scoreRepository.save(s);
        });
        gameRepository.delete(game);
    }

    /** Tim van dau va kiem tra quyen: chu van hoac ADMIN. */
    private Game findAllowed(Long id, Long userId, boolean admin) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ván cờ có id = " + id));
        if (!admin && !game.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền với ván cờ này");
        }
        return game;
    }
}
