package com.quizorbit.backend.service;

import com.quizorbit.backend.config.JwtUtil;
import com.quizorbit.backend.entity.User;
import com.quizorbit.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // SIGNUP
    public Map<String, String> signup(String name, String email,
                                      String password, String role) {

        // Checking if user already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }

        // creating new user
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(User.Role.valueOf(role.toUpperCase()));

        // saving to database
        userRepository.save(user);

        // generating token
        String token = jwtUtil.generateToken(email, role.toUpperCase());

        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("role", role.toUpperCase());
        response.put("name", name);
        response.put("email", email);
        return response;
    }

    // login
    public Map<String, String> login(String email, String password) {

        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        // Generate token
        String token = jwtUtil.generateToken(email,
                                user.getRole().name());

        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("role", user.getRole().name());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        return response;
    }
}