package com.example.caro.controller;

import com.example.caro.dto.CreateRoomRequest;
import com.example.caro.dto.MoveDto;
import com.example.caro.dto.OnlineRoomResponse;
import com.example.caro.service.OnlineRoomService;
import com.example.caro.util.SessionUser;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
public class OnlineRoomController {

    private final OnlineRoomService onlineRoomService;

    public OnlineRoomController(OnlineRoomService onlineRoomService) {
        this.onlineRoomService = onlineRoomService;
    }

    /** Danh sách các phòng đang chờ */
    @GetMapping
    public List<OnlineRoomResponse> getWaitingRooms() {
        return onlineRoomService.getWaitingRooms();
    }

    @GetMapping("/waiting")
    public List<OnlineRoomResponse> getWaitingRoomsAlias() {
        return onlineRoomService.getWaitingRooms();
    }

    /** Tạo phòng mới */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OnlineRoomResponse createRoom(@Valid @RequestBody CreateRoomRequest request, HttpSession session) {
        return onlineRoomService.createRoom(SessionUser.id(session), request);
    }

    /** Lấy chi tiết phòng (Polling đồng bộ) */
    @GetMapping("/{roomCode}")
    public OnlineRoomResponse getRoom(@PathVariable("roomCode") String roomCode) {
        return onlineRoomService.getRoom(roomCode);
    }

    /** Tham gia phòng */
    @PostMapping("/{roomCode}/join")
    public OnlineRoomResponse joinRoom(@PathVariable("roomCode") String roomCode, HttpSession session) {
        return onlineRoomService.joinRoom(roomCode, SessionUser.id(session));
    }

    /** Gửi nước đi trong phòng */
    @PostMapping("/{roomCode}/move")
    public OnlineRoomResponse makeMove(@PathVariable("roomCode") String roomCode,
                                       @Valid @RequestBody MoveDto move,
                                       HttpSession session) {
        return onlineRoomService.makeOnlineMove(roomCode, SessionUser.id(session), move);
    }

    /** Khiêu chiến / Sẵn sàng vào trận / Đấu lại ván mới */
    @PostMapping("/{roomCode}/ready")
    public OnlineRoomResponse setReady(@PathVariable("roomCode") String roomCode,
                                       @RequestParam(value = "ready", defaultValue = "true") boolean ready,
                                       HttpSession session) {
        return onlineRoomService.toggleReady(roomCode, SessionUser.id(session), ready);
    }

    /** Rời phòng (Xử thua nếu đang trong trận) */
    @PostMapping("/{roomCode}/leave")
    public OnlineRoomResponse leaveRoom(@PathVariable("roomCode") String roomCode, HttpSession session) {
        return onlineRoomService.leaveRoom(roomCode, SessionUser.id(session));
    }
}
