package com.example.caro.controller;

import com.example.caro.bot.BotService;
import com.example.caro.dto.BotMoveRequest;
import com.example.caro.dto.BotMoveResponse;
import com.example.caro.dto.GameRequest;
import com.example.caro.dto.GameResponse;
import com.example.caro.dto.GameUpdateRequest;
import com.example.caro.service.GameService;
import com.example.caro.util.SessionUser;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;
    private final BotService botService;

    public GameController(GameService gameService, BotService botService) {
        this.gameService = gameService;
        this.botService = botService;
    }

    /** Tinh toan nuoc di cua Bot AI (OOP Design) */
    @PostMapping("/bot-move")
    public BotMoveResponse botMove(@Valid @RequestBody BotMoveRequest request) {
        return botService.getNextMove(request);
    }

    /** Luu mot van vua choi xong. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GameResponse save(@Valid @RequestBody GameRequest request, HttpSession session) {
        return gameService.save(SessionUser.id(session), request);
    }

    /** Lich su van dau (ADMIN thay tat ca). */
    @GetMapping
    public List<GameResponse> list(HttpSession session) {
        return gameService.list(SessionUser.id(session), SessionUser.isAdmin(session));
    }

    /** Chi tiet mot van, kem cac nuoc di de xem lai. */
    @GetMapping("/{id}")
    public GameResponse get(@PathVariable("id") Long id, HttpSession session) {
        return gameService.get(id, SessionUser.id(session), SessionUser.isAdmin(session));
    }

    @PutMapping("/{id}")
    public GameResponse update(@PathVariable("id") Long id, @Valid @RequestBody GameUpdateRequest request, HttpSession session) {
        return gameService.updateNames(id, SessionUser.id(session), SessionUser.isAdmin(session), request);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable("id") Long id, HttpSession session) {
        gameService.delete(id, SessionUser.id(session), SessionUser.isAdmin(session));
        return Map.of("message", "Đã xóa ván cờ");
    }
}
