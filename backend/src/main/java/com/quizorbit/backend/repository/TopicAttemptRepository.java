package com.quizorbit.backend.repository;

import com.quizorbit.backend.entity.TopicAttempt;
import com.quizorbit.backend.entity.User;
import com.quizorbit.backend.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TopicAttemptRepository
        extends JpaRepository<TopicAttempt, Long> {

    List<TopicAttempt> findByStudent(User student);

    List<TopicAttempt> findByQuiz(Quiz quiz);

    Optional<TopicAttempt> findByStudentAndQuiz(User student, Quiz quiz);

    @Query("SELECT t FROM TopicAttempt t WHERE t.quiz = :quiz " +
           "ORDER BY t.score DESC, t.timeTaken ASC")
    List<TopicAttempt> findLeaderboardByQuiz(Quiz quiz);
}