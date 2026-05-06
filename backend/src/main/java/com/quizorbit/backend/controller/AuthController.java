package com.quizorbit.backend.controller;

import com.quizorbit.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(
            @RequestBody Map<String, String> request) {

        Map<String, String> response = authService.signup(
                request.get("name"),
                request.get("email"),
                request.get("password"),
                request.get("role")
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @RequestBody Map<String, String> request) {

        Map<String, String> response = authService.login(
                request.get("email"),
                request.get("password")
        );
        return ResponseEntity.ok(response);
    }
}