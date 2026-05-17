package com.quizorbit.backend.controller;

import com.quizorbit.backend.entity.Quiz;
import com.quizorbit.backend.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class QuizController {

    private final QuizService quizService;

    // ── These specific routes MUST come before /{id} ──

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generate(
            @RequestBody Map<String, Object> request,
            Authentication auth) throws Exception {

        Map<String, Object> result = quizService.generateFromTopic(
                auth.getName(),
                (String) request.get("title"),
                (String) request.get("topic"),
                (String) request.get("difficulty"),
                Integer.parseInt(String.valueOf(
                        request.getOrDefault("numQuestions", 5)))
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/generate-from-file")
    public ResponseEntity<Map<String, Object>> generateFromFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("difficulty") String difficulty,
            @RequestParam("numQuestions") int numQuestions,
            Authentication auth) throws Exception {

        Map<String, Object> result = quizService.generateFromFile(
                auth.getName(), file, title, difficulty, numQuestions);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/save")
    public ResponseEntity<Quiz> saveQuiz(
            @RequestBody Map<String, Object> request,
            Authentication auth) {

        Quiz quiz = quizService.saveQuiz(auth.getName(), request);
        return ResponseEntity.ok(quiz);
    }

    @GetMapping("/my-quizzes")
    public ResponseEntity<List<Map<String, Object>>> getMyQuizzes(
            Authentication auth) {

        return ResponseEntity.ok(
                quizService.getMyQuizzes(auth.getName()));
    }

    // ── These /{id} routes come LAST ──

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(
            @PathVariable Long id) {

        return ResponseEntity.ok(quizService.getLeaderboard(id));
    }

    @PostMapping("/{id}/attempt")
    public ResponseEntity<Map<String, Object>> submitAttempt(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            Authentication auth) {

        List<Map<String, Object>> answers =
                (List<Map<String, Object>>) request.get("answers");
        Integer timeTaken = Integer.parseInt(
                String.valueOf(request.getOrDefault("timeTaken", 0)));

        return ResponseEntity.ok(
                quizService.submitAttempt(
                        auth.getName(), id, answers, timeTaken));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getQuiz(
            @PathVariable Long id) {

        return ResponseEntity.ok(quizService.getQuizById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(
            @PathVariable Long id,
            Authentication auth) {

        quizService.deleteQuiz(auth.getName(), id);
        return ResponseEntity.ok().build();
    }
}