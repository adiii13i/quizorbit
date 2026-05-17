package com.quizorbit.backend.repository;

import com.quizorbit.backend.entity.QuizAttemptAnswer;
import com.quizorbit.backend.entity.TopicAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizAttemptAnswerRepository
        extends JpaRepository<QuizAttemptAnswer, Long> {
    List<QuizAttemptAnswer> findByAttempt(TopicAttempt attempt);
}