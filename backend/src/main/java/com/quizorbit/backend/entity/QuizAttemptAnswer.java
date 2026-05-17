package com.quizorbit.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "quiz_attempt_answers")
public class QuizAttemptAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which attempt this belongs to
    @ManyToOne
    @JoinColumn(name = "attempt_id", nullable = false)
    private TopicAttempt attempt;

    // Which question was answered
    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    // Which option the student chose
    @ManyToOne
    @JoinColumn(name = "selected_option_id")
    private Option selectedOption;

    // Was it correct?
    @Column(nullable = false)
    private boolean correct;
}