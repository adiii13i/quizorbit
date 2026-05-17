package com.quizorbit.backend.service;

import com.quizorbit.backend.entity.*;
import com.quizorbit.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final TopicAttemptRepository attemptRepository;
    private final QuizAttemptAnswerRepository answerRepository;
    private final GeminiService geminiService;
    private final FileParserService fileParserService;

    // ── Generate from Topic ───────────────────────────────

    public Map<String, Object> generateFromTopic(
            String email,
            String title,
            String topic,
            String difficulty,
            int numQuestions) throws Exception {

        List<Map<String, Object>> questions =
                geminiService.generateQuestions(
                        topic, difficulty, numQuestions);

        Map<String, Object> response = new HashMap<>();
        response.put("title", title);
        response.put("difficulty", difficulty);
        response.put("questions", questions);
        return response;
    }

    // ── Generate from File ────────────────────────────────

    public Map<String, Object> generateFromFile(
            String email,
            MultipartFile file,
            String title,
            String difficulty,
            int numQuestions) throws Exception {

        String content = fileParserService.extractText(file);

        List<Map<String, Object>> questions =
                geminiService.generateQuestions(
                        content, difficulty, numQuestions);

        Map<String, Object> response = new HashMap<>();
        response.put("title", title);
        response.put("difficulty", difficulty);
        response.put("questions", questions);
        return response;
    }

    // ── Save Quiz ─────────────────────────────────────────

    public Quiz saveQuiz(String email,
                         Map<String, Object> request) {

        User tutor = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Create quiz
        Quiz quiz = new Quiz();
        quiz.setTitle((String) request.get("title"));
        quiz.setDifficulty(Quiz.Difficulty.valueOf(
                (String) request.get("difficulty")));
        quiz.setPublic(Boolean.parseBoolean(
                String.valueOf(
                        request.getOrDefault("isPublic", false))));
        quiz.setTutor(tutor);
        quiz.setMaxParticipants(25);
        quiz.setParticipantCount(0);

        Quiz savedQuiz = quizRepository.save(quiz);

        // Save questions
        List<Map<String, Object>> questionsData =
                (List<Map<String, Object>>) request.get("questions");

        if (questionsData != null) {
            for (int i = 0; i < questionsData.size(); i++) {
                Map<String, Object> qData = questionsData.get(i);

                Question question = new Question();
                question.setQuestionText(
                        (String) qData.get("questionText"));
                question.setOrderIndex(i + 1);
                question.setQuiz(savedQuiz);
                Question savedQuestion =
                        questionRepository.save(question);

                // Save options
                List<Map<String, Object>> optionsData =
                        (List<Map<String, Object>>)
                                qData.get("options");

                if (optionsData != null) {
                    for (Map<String, Object> oData : optionsData) {
                        Option option = new Option();
                        option.setOptionText(
                                (String) oData.get("optionText"));
                        option.setCorrect(Boolean.parseBoolean(
                                String.valueOf(
                                        oData.get("isCorrect"))));
                        option.setQuestion(savedQuestion);

                        // Save option directly
                        savedQuestion.getOptions().add(option);
                    }
                    questionRepository.save(savedQuestion);
                }
            }
        }

        return savedQuiz;
    }

    // ── Get Tutor Quizzes ─────────────────────────────────

    public List<Map<String, Object>> getMyQuizzes(String email) {
        User tutor = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        List<Quiz> quizzes = quizRepository.findByTutor(tutor);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Quiz quiz : quizzes) {
            Map<String, Object> q = new HashMap<>();
            q.put("id", quiz.getId());
            q.put("title", quiz.getTitle());
            q.put("difficulty", quiz.getDifficulty());
            q.put("isPublic", quiz.isPublic());
            q.put("participantCount", quiz.getParticipantCount());
            q.put("maxParticipants", quiz.getMaxParticipants());
            q.put("createdAt", quiz.getCreatedAt());
            result.add(q);
        }
        return result;
    }

    // ── Get Single Quiz with Questions ────────────────────

    public Map<String, Object> getQuizById(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() ->
                        new RuntimeException("Quiz not found"));

        List<Question> questions =
                questionRepository.findByQuizOrderByOrderIndex(quiz);

        Map<String, Object> result = new HashMap<>();
        result.put("id", quiz.getId());
        result.put("title", quiz.getTitle());
        result.put("difficulty", quiz.getDifficulty());
        result.put("isPublic", quiz.isPublic());
        result.put("maxParticipants", quiz.getMaxParticipants());
        result.put("participantCount", quiz.getParticipantCount());

        List<Map<String, Object>> questionList = new ArrayList<>();
        for (Question q : questions) {
            Map<String, Object> qMap = new HashMap<>();
            qMap.put("id", q.getId());
            qMap.put("questionText", q.getQuestionText());
            qMap.put("orderIndex", q.getOrderIndex());

            List<Map<String, Object>> optionList = new ArrayList<>();
            for (Option o : q.getOptions()) {
                Map<String, Object> oMap = new HashMap<>();
                oMap.put("id", o.getId());
                oMap.put("optionText", o.getOptionText());
                // Don't send isCorrect to student!
                optionList.add(oMap);
            }
            qMap.put("options", optionList);
            questionList.add(qMap);
        }
        result.put("questions", questionList);
        return result;
    }

    // ── Submit Attempt ────────────────────────────────────

    public Map<String, Object> submitAttempt(
            String email,
            Long quizId,
            List<Map<String, Object>> answers,
            Integer timeTaken) {

        User student = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() ->
                        new RuntimeException("Quiz not found"));

        // Check participant limit
        if (quiz.getParticipantCount() >= quiz.getMaxParticipants()) {
            throw new RuntimeException(
                    "Quiz is full. Maximum " +
                    quiz.getMaxParticipants() +
                    " students allowed.");
        }

        // Calculate score
        int correct = 0;
        int total = answers.size();
        List<Map<String, Object>> answerResults = new ArrayList<>();

        for (Map<String, Object> answer : answers) {
            Long questionId = Long.valueOf(
                    String.valueOf(answer.get("questionId")));
            Long selectedOptionId = answer.get("selectedOptionId") != null
                    ? Long.valueOf(
                            String.valueOf(answer.get("selectedOptionId")))
                    : null;

            Question question = questionRepository
                    .findById(questionId)
                    .orElse(null);

            if (question == null) continue;

            // Find correct option
            Option correctOption = question.getOptions()
                    .stream()
                    .filter(Option::isCorrect)
                    .findFirst()
                    .orElse(null);

            boolean isCorrect = selectedOptionId != null &&
                    correctOption != null &&
                    selectedOptionId.equals(correctOption.getId());

            if (isCorrect) correct++;

            // Build result for this answer
            Map<String, Object> result = new HashMap<>();
            result.put("questionId", questionId);
            result.put("questionText", question.getQuestionText());
            result.put("selectedOptionId", selectedOptionId);
            result.put("correctOptionId",
                    correctOption != null ? correctOption.getId() : null);
            result.put("correctOptionText",
                    correctOption != null
                            ? correctOption.getOptionText() : null);
            result.put("isCorrect", isCorrect);
            answerResults.add(result);
        }

        int score = total > 0 ? (correct * 100) / total : 0;

        // Save attempt
        TopicAttempt attempt = new TopicAttempt();
        attempt.setStudent(student);
        attempt.setQuiz(quiz);
        attempt.setTopic(quiz.getTitle());
        attempt.setScore(score);
        attempt.setCorrectAnswers(correct);
        attempt.setTotalQuestions(total);
        attempt.setTimeTaken(timeTaken);
        TopicAttempt savedAttempt = attemptRepository.save(attempt);

        // Update participant count
        quiz.setParticipantCount(quiz.getParticipantCount() + 1);
        quizRepository.save(quiz);

        // Build strengths and weaknesses
        List<Map<String, Object>> strengths = new ArrayList<>();
        List<Map<String, Object>> weaknesses = new ArrayList<>();

        for (Map<String, Object> ar : answerResults) {
            if ((boolean) ar.get("isCorrect")) {
                strengths.add(ar);
            } else {
                weaknesses.add(ar);
            }
        }

        // Final response
        Map<String, Object> response = new HashMap<>();
        response.put("attemptId", savedAttempt.getId());
        response.put("score", score);
        response.put("correct", correct);
        response.put("total", total);
        response.put("timeTaken", timeTaken);
        response.put("strengths", strengths);
        response.put("weaknesses", weaknesses);
        response.put("answers", answerResults);
        return response;
    }

    // ── Get Leaderboard ───────────────────────────────────

    public List<Map<String, Object>> getLeaderboard(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() ->
                        new RuntimeException("Quiz not found"));

        List<TopicAttempt> attempts =
                attemptRepository.findLeaderboardByQuiz(quiz);

        List<Map<String, Object>> leaderboard = new ArrayList<>();

        for (int i = 0; i < attempts.size(); i++) {
            TopicAttempt attempt = attempts.get(i);
            Map<String, Object> entry = new HashMap<>();
            entry.put("rank", i + 1);
            entry.put("studentName", attempt.getStudent().getName());
            entry.put("score", attempt.getScore());
            entry.put("correct", attempt.getCorrectAnswers());
            entry.put("total", attempt.getTotalQuestions());
            entry.put("timeTaken", attempt.getTimeTaken());
            leaderboard.add(entry);
        }

        return leaderboard;
    }

    // ── Delete Quiz ───────────────────────────────────────

    public void deleteQuiz(String email, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() ->
                        new RuntimeException("Quiz not found"));

        if (!quiz.getTutor().getEmail().equals(email)) {
            throw new RuntimeException(
                    "Not authorized to delete this quiz");
        }

        quizRepository.delete(quiz);
    }
}