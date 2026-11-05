package com.example.caro.service;

import com.example.caro.dto.RegisterRequest;
import com.example.caro.dto.UserResponse;
import com.example.caro.entity.Role;
import com.example.caro.entity.Score;
import com.example.caro.entity.User;
import com.example.caro.exception.DuplicateResourceException;
import com.example.caro.exception.ResourceNotFoundException;
import com.example.caro.exception.UnauthorizedException;
import com.example.caro.repository.RoleRepository;
import com.example.caro.repository.ScoreRepository;
import com.example.caro.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/** Nghiep vu dang ky va dang nhap. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ScoreRepository scoreRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       ScoreRepository scoreRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.scoreRepository = scoreRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse register(RegisterRequest req) {
        String username = req.username().trim();
        if (userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Tên đăng nhập '" + username + "' đã tồn tại");
        }
        Role player = roleRepository.findByName("PLAYER")
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có vai trò PLAYER trong CSDL"));

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setFullName(req.fullName().trim());
        user.setRole(player);
        userRepository.save(user);
        scoreRepository.save(new Score(user));
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public User authenticate(String username, String password) {
        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new UnauthorizedException("Sai tên đăng nhập hoặc mật khẩu"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Sai tên đăng nhập hoặc mật khẩu");
        }
        return user;
    }

    @Transactional
    public User authenticateGoogle(GoogleAuthService.GoogleUserInfo info) {
        // 1. Tìm theo Google ID đã liên kết trước đó
        Optional<User> byGoogleId = userRepository.findByGoogleId(info.sub());
        if (byGoogleId.isPresent()) {
            User existing = byGoogleId.get();
            // Cập nhật email hoặc tên nếu có thay đổi
            if (info.email() != null && !info.email().equalsIgnoreCase(existing.getEmail())) {
                existing.setEmail(info.email());
            }
            return userRepository.save(existing);
        }

        // 2. Nếu chưa có Google ID, tìm theo Email (Account Linking an toàn)
        if (info.email() != null && !info.email().isBlank()) {
            Optional<User> byEmail = userRepository.findByEmail(info.email().trim().toLowerCase());
            if (byEmail.isPresent()) {
                User existing = byEmail.get();
                // Liên kết tài khoản hiện có với Google ID
                existing.setGoogleId(info.sub());
                return userRepository.save(existing);
            }
        }

        // 3. Nếu là người dùng hoàn toàn mới -> Tự động đăng ký tài khoản với vai trò PLAYER
        Role playerRole = roleRepository.findByName("PLAYER")
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có vai trò PLAYER trong CSDL"));

        String baseUsername = "gg_";
        if (info.email() != null && !info.email().isBlank()) {
            String prefix = info.email().split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
            baseUsername = (prefix.length() > 2 ? prefix : "gg_" + prefix);
        }
        if (baseUsername.length() > 15) {
            baseUsername = baseUsername.substring(0, 15);
        }

        String username = baseUsername;
        int counter = 1;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + "_" + (java.util.concurrent.ThreadLocalRandom.current().nextInt(100, 9999));
            counter++;
            if (counter > 10) {
                username = "gg_" + UUID.randomUUID().toString().substring(0, 8);
                break;
            }
        }

        User newUser = new User();
        newUser.setUsername(username);
        // Tạo mật khẩu ngẫu nhiên không thể đoán để bảo vệ tài khoản Google khỏi brute-force mật khẩu
        newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        newUser.setFullName(info.name());
        newUser.setEmail(info.email() != null ? info.email().trim().toLowerCase() : null);
        newUser.setGoogleId(info.sub());
        newUser.setAuthProvider("GOOGLE");
        newUser.setRole(playerRole);
        newUser.setCoins(500);

        userRepository.save(newUser);
        scoreRepository.save(new Score(newUser));

        return newUser;
    }
}
