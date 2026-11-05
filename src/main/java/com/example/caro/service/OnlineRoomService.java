package com.example.caro.service;

import com.example.caro.bot.BoardState;
import com.example.caro.dto.CreateRoomRequest;
import com.example.caro.dto.GameRequest;
import com.example.caro.dto.GameResponse;
import com.example.caro.dto.MoveDto;
import com.example.caro.dto.OnlineRoomResponse;
import com.example.caro.dto.UserResponse;
import com.example.caro.exception.BadRequestException;
import com.example.caro.exception.ResourceNotFoundException;
import com.example.caro.model.OnlineRoom;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OnlineRoomService {

    private final Map<String, OnlineRoom> rooms = new ConcurrentHashMap<>();
    private final UserService userService;
    private final GameService gameService;
    private final SecureRandom random = new SecureRandom();

    public OnlineRoomService(UserService userService, GameService gameService) {
        this.userService = userService;
        this.gameService = gameService;
    }

    /** Tạo phòng mới */
    public OnlineRoomResponse createRoom(Long userId, CreateRoomRequest req) {
        cleanExpiredRooms();

        UserResponse user = userService.getById(userId);
        String roomCode = generateRoomCode();
        int size = (req.boardSize() != null && (req.boardSize() == 5 || req.boardSize() == 10)) ? req.boardSize() : 3;
        String mode = (size == 3 && "INFINITE".equalsIgnoreCase(req.gameMode())) ? "INFINITE" : "CLASSIC";
        String hostName = user.fullName() != null && !user.fullName().isBlank() ? user.fullName() : user.username();

        OnlineRoom room = new OnlineRoom(roomCode, userId, hostName, size, mode);
        rooms.put(roomCode, room);

        return OnlineRoomResponse.from(room);
    }

    /** Lấy danh sách các phòng đang chờ người chơi thứ 2 */
    public List<OnlineRoomResponse> getWaitingRooms() {
        cleanExpiredRooms();
        return rooms.values().stream()
                .filter(r -> "WAITING".equals(r.getStatus()))
                .sorted(Comparator.comparing(OnlineRoom::getCreatedAt).reversed())
                .map(OnlineRoomResponse::from)
                .toList();
    }

    /** Lấy chi tiết phòng */
    public OnlineRoomResponse getRoom(String roomCode) {
        OnlineRoom room = findRoom(roomCode);
        return OnlineRoomResponse.from(room);
    }

    /** Tham gia phòng */
    public synchronized OnlineRoomResponse joinRoom(String roomCode, Long userId) {
        OnlineRoom room = findRoom(roomCode);

        if ("FINISHED".equals(room.getStatus())) {
            throw new BadRequestException("Phòng này đã kết thúc trận đấu");
        }

        // Nếu là chủ phòng (hoặc cùng 1 tài khoản test thử)
        if (room.getHostUserId().equals(userId)) {
            // Nếu phòng chưa có khách, cho phép chủ phòng tự test (vai trò O tự động)
            if (room.getGuestUserId() == null) {
                UserResponse hostUser = userService.getById(userId);
                room.setGuestUserId(userId);
                room.setPlayerO((hostUser.fullName() != null && !hostUser.fullName().isBlank() ? hostUser.fullName() : hostUser.username()) + " (Kỳ thủ 2)");
                room.setStatus("PLAYING");
                room.setLastActivityAt(LocalDateTime.now());
            }
            return OnlineRoomResponse.from(room);
        }

        // Nếu đã có khách và khách là người này vào lại
        if (room.getGuestUserId() != null && room.getGuestUserId().equals(userId)) {
            return OnlineRoomResponse.from(room);
        }

        // Nếu phòng đã đủ 2 người và là người lạ
        if (room.getGuestUserId() != null) {
            throw new BadRequestException("Phòng này đã đủ 2 người chơi");
        }

        UserResponse guestUser = userService.getById(userId);
        room.setGuestUserId(userId);
        room.setPlayerO(guestUser.fullName() != null && !guestUser.fullName().isBlank() ? guestUser.fullName() : guestUser.username());
        room.setStatus("PLAYING");
        room.setLastActivityAt(LocalDateTime.now());

        return OnlineRoomResponse.from(room);
    }

    /** Đánh nước cờ */
    public synchronized OnlineRoomResponse makeOnlineMove(String roomCode, Long userId, MoveDto move) {
        OnlineRoom room = findRoom(roomCode);

        if (!"PLAYING".equals(room.getStatus())) {
            throw new BadRequestException("Phòng chưa sẵn sàng hoặc ván cờ đã kết thúc");
        }

        // Xác định vai trò của người gửi
        char userSymbol;
        if (userId.equals(room.getHostUserId())) {
            userSymbol = 'X';
        } else if (userId.equals(room.getGuestUserId())) {
            userSymbol = 'O';
        } else {
            throw new BadRequestException("Bạn không phải thành viên tham gia ván đấu này");
        }

        // Kiểm tra đúng lượt đi
        if (userSymbol != room.getCurrentTurn()) {
            throw new BadRequestException("Chưa đến lượt đi của bạn! Hiện tại là lượt của " + room.getCurrentTurn());
        }

        // Khớp symbol gửi lên
        if (!String.valueOf(userSymbol).equalsIgnoreCase(move.symbol())) {
            throw new BadRequestException("Quân cờ gửi lên không khớp vai trò của bạn");
        }

        // Tái hiện trạng thái bàn cờ hiện tại để kiểm tra ô hợp lệ
        boolean infinite = (room.getBoardSize() == 3) && "INFINITE".equalsIgnoreCase(room.getGameMode());
        BoardState state = new BoardState(room.getBoardSize(), infinite);
        for (MoveDto m : room.getMoves()) {
            state.makeMove(m.row(), m.col(), m.symbol().charAt(0));
        }

        if (!state.isCellEmpty(move.row(), move.col())) {
            throw new BadRequestException("Ô (" + move.row() + ", " + move.col() + ") đã có quân cờ!");
        }

        // Đánh nước đi vào BoardState
        state.makeMove(move.row(), move.col(), userSymbol);
        room.getMoves().add(move);
        room.setLastActivityAt(LocalDateTime.now());

        // Kiểm tra thắng thua
        char winRes = state.checkWinner();
        if (winRes == 'X' || winRes == 'O') {
            room.setStatus("FINISHED");
            room.setWinner(String.valueOf(winRes));
            saveOnlineGameToDatabase(room);
        } else if (winRes == 'D') {
            room.setStatus("FINISHED");
            room.setWinner("DRAW");
            saveOnlineGameToDatabase(room);
        } else {
            // Chuyển lượt đi
            room.setCurrentTurn((userSymbol == 'X') ? 'O' : 'X');
        }

        return OnlineRoomResponse.from(room);
    }

    /** Người chơi ấn Sẵn Sàng / Khiêu Chiến hoặc Đấu Ván Mới */
    public synchronized OnlineRoomResponse toggleReady(String roomCode, Long userId, boolean ready) {
        OnlineRoom room = findRoom(roomCode);

        // Nếu phòng vừa kết thúc và muốn đấu ván mới
        if ("FINISHED".equals(room.getStatus())) {
            room.setStatus("PLAYING");
            room.setWinner(null);
            room.getMoves().clear();
            room.setCurrentTurn('X');
            room.setSavedGameId(null);
            room.setReadyX(false);
            room.setReadyO(false);
        }

        if (userId.equals(room.getHostUserId())) {
            room.setReadyX(ready);
        } else if (userId.equals(room.getGuestUserId())) {
            room.setReadyO(ready);
        }

        // Nếu cả hai đã sẵn sàng
        if (room.isReadyX() && room.isReadyO()) {
            room.setStatus("PLAYING");
        }

        room.setLastActivityAt(LocalDateTime.now());
        return OnlineRoomResponse.from(room);
    }

    /** Xử lý khi người chơi chủ động Rời phòng -> Xử thua (Surrender/Abandon) */
    public synchronized OnlineRoomResponse leaveRoom(String roomCode, Long userId) {
        OnlineRoom room = findRoom(roomCode);

        // Nếu đang trong trận đấu ("PLAYING") mà 1 bên thoát -> Xử thua người thoát, đối phương thắng!
        if ("PLAYING".equals(room.getStatus())) {
            if (userId.equals(room.getHostUserId())) {
                // Chủ phòng (X) thoát -> O thắng
                room.setStatus("FINISHED");
                room.setWinner("O");
            } else if (userId.equals(room.getGuestUserId())) {
                // Khách (O) thoát -> X thắng
                room.setStatus("FINISHED");
                room.setWinner("X");
            }
            saveOnlineGameToDatabase(room);
        } else if ("WAITING".equals(room.getStatus())) {
            // Nếu chưa bắt đầu mà chủ phòng thoát -> Hủy phòng
            if (userId.equals(room.getHostUserId())) {
                rooms.remove(roomCode);
            }
        }

        room.setLastActivityAt(LocalDateTime.now());
        return OnlineRoomResponse.from(room);
    }

    /** Tự động lưu ván cờ vào Database MySQL qua GameService */
    private void saveOnlineGameToDatabase(OnlineRoom room) {
        if (room.getSavedGameId() != null) return; // Đã lưu rồi thì thôi

        try {
            GameRequest req = new GameRequest(
                    room.getPlayerX(),
                    room.getPlayerO() != null ? room.getPlayerO() : "Khách",
                    List.copyOf(room.getMoves())
            );
            GameResponse saved = gameService.save(room.getHostUserId(), req);
            room.setSavedGameId(saved.id());
        } catch (Exception e) {
            // Ghi nhận lỗi lưu nhưng không làm hỏng tiến trình phòng
            System.err.println("Lỗi lưu ván cờ online: " + e.getMessage());
        }
    }

    private OnlineRoom findRoom(String roomCode) {
        if (roomCode == null) throw new BadRequestException("Mã phòng không được để trống");
        OnlineRoom room = rooms.get(roomCode.trim().toUpperCase());
        if (room == null) {
            throw new ResourceNotFoundException("Không tìm thấy phòng với mã: " + roomCode);
        }
        return room;
    }

    /** Sinh mã phòng ngẫu nhiên 6 ký tự in hoa */
    private String generateRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        String code;
        do {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 6; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            code = sb.toString();
        } while (rooms.containsKey(code));
        return code;
    }

    /** Dọn dẹp phòng không hoạt động quá 30 phút */
    private void cleanExpiredRooms() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);
        rooms.entrySet().removeIf(entry -> entry.getValue().getLastActivityAt().isBefore(cutoff));
    }
}
