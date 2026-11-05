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
}
