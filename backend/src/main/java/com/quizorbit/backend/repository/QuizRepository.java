package com.quizorbit.backend.repository;

import com.quizorbit.backend.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.quizorbit.backend.entity.User;
import java.util.List;


@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByTutor(User tutor);
    List<Quiz> findByIsPublicTrue();
    List<Quiz> findByTutorAndIsPublicTrue(User tutor);
}
