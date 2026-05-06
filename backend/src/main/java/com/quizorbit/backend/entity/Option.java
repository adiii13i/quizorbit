package com.quizorbit.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "options")
public class Option {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String optionText;

    @Column(nullable = false)
    private boolean isCorrect = false;

    // Many options belong to one question
    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;
}