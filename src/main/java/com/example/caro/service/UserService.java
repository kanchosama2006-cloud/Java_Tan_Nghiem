package com.example.caro.service;

import com.example.caro.dto.ChangePasswordRequest;
import com.example.caro.dto.UpdateProfileRequest;
import com.example.caro.dto.UserResponse;
import com.example.caro.entity.User;
import com.example.caro.exception.BadRequestException;
import com.example.caro.exception.ResourceNotFoundException;
import com.example.caro.repository.GameRepository;
import com.example.caro.repository.ScoreRepository;
import com.example.caro.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final ScoreRepository scoreRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, GameRepository gameRepository,
                       ScoreRepository scoreRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.scoreRepository = scoreRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return UserResponse.from(find(id));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listAll() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse updateProfile(Long id, UpdateProfileRequest req) {
        User user = find(id);
        user.setFullName(req.fullName().trim());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long id, ChangePasswordRequest req) {
        User user = find(id);
        if (!passwordEncoder.matches(req.oldPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu cũ không đúng");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
    }

    /** ADMIN xoa tai khoan: xoa luon cac van dau va thong ke cua tai khoan do. */
    @Transactional
    public void delete(Long id, Long currentUserId) {
        if (id.equals(currentUserId)) {
            throw new BadRequestException("Không thể tự xóa tài khoản đang đăng nhập");
        }
        User user = find(id);
        gameRepository.deleteAll(gameRepository.findByUserIdOrderByStartedAtDesc(id));
        scoreRepository.findByUserId(id).ifPresent(scoreRepository::delete);
        userRepository.delete(user);
    }

    private User find(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng có id = " + id));
    }
}
