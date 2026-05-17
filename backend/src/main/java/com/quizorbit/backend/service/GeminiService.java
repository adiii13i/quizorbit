package com.quizorbit.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GEMINI_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        "gemini-2.0-flash:generateContent?key=";

    public List<Map<String, Object>> generateQuestions(
            String content,
            String difficulty,
            int numQuestions) throws Exception {

        String prompt = buildGenerationPrompt(
                content, difficulty, numQuestions);
        String rawResponse = callGemini(prompt);
        List<Map<String, Object>> questions = parseQuestions(rawResponse);
        return validateQuestions(questions, content);
    }

    private List<Map<String, Object>> validateQuestions(
            List<Map<String, Object>> questions,
            String content) throws Exception {

        String prompt = buildValidationPrompt(questions, content);
        String rawResponse = callGemini(prompt);
        try {
            return parseQuestions(rawResponse);
        } catch (Exception e) {
            return questions;
        }
    }


    private String callGemini(String prompt) throws Exception {
        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        Map<String, Object> part = new HashMap<>();

        part.put("text", prompt);
        content.put("parts", List.of(part));
        requestBody.put("contents", List.of(content));

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_URL + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(
                request,
                HttpResponse.BodyHandlers.ofString()
        );

        if (response.statusCode() != 200) {
            throw new RuntimeException(
                    "Gemini API error: " + response.body()
            );
        }

        JsonNode root = objectMapper.readTree(response.body());
        return root.path("candidates")
                   .path(0)
                   .path("content")
                   .path("parts")
                   .path(0)
                   .path("text")
                   .asText();
    }


    private String buildGenerationPrompt(
            String content,
            String difficulty,
            int numQuestions) {
        return """
            You are an expert quiz generator.
            Generate exactly %d multiple choice questions based on:

            CONTENT: %s
            DIFFICULTY: %s

            STRICT RULES:
            1. Each question must have exactly 4 options
            2. Exactly one option must be correct
            3. Questions must be clear and unambiguous
            4. Return ONLY valid JSON, no extra text

            Return this EXACT JSON format:
            {
              "questions": [
                {
                  "questionText": "Question here?",
                  "options": [
                    {"optionText": "Option A", "isCorrect": true},
                    {"optionText": "Option B", "isCorrect": false},
                    {"optionText": "Option C", "isCorrect": false},
                    {"optionText": "Option D", "isCorrect": false}
                  ]
                }
              ]
            }
            """.formatted(numQuestions, content, difficulty);
    }

    private String buildValidationPrompt(
            List<Map<String, Object>> questions,
            String content) throws Exception {
        String questionsJson = objectMapper.writeValueAsString(questions);
        return """
            You are an expert quiz validator.
            Review these questions for accuracy and correctness:

            ORIGINAL CONTENT: %s
            QUESTIONS: %s

            VALIDATION RULES:
            1. Check each question is factually correct
            2. Check the marked correct answer is actually correct
            3. Check all options are plausible
            4. Fix any errors you find

            Return the corrected questions in this EXACT JSON format:
            {
              "questions": [
                {
                  "questionText": "Question here?",
                  "options": [
                    {"optionText": "Option A", "isCorrect": true},
                    {"optionText": "Option B", "isCorrect": false},
                    {"optionText": "Option C", "isCorrect": false},
                    {"optionText": "Option D", "isCorrect": false}
                  ]
                }
              ]
            }
            """.formatted(content, questionsJson);
    }


    private List<Map<String, Object>> parseQuestions(
            String rawResponse) throws Exception {
        String cleaned = rawResponse
                .replaceAll("```json", "")
                .replaceAll("```", "")
                .trim();

        JsonNode root = objectMapper.readTree(cleaned);
        JsonNode questionsNode = root.path("questions");

        List<Map<String, Object>> questions = new ArrayList<>();

        for (JsonNode qNode : questionsNode) {
            Map<String, Object> question = new HashMap<>();
            question.put("questionText",
                    qNode.path("questionText").asText());

            List<Map<String, Object>> options = new ArrayList<>();
            for (JsonNode oNode : qNode.path("options")) {
                Map<String, Object> option = new HashMap<>();
                option.put("optionText",
                        oNode.path("optionText").asText());
                option.put("isCorrect",
                        oNode.path("isCorrect").asBoolean());
                options.add(option);
            }
            question.put("options", options);
            questions.add(question);
        }

        return questions;
    }
}