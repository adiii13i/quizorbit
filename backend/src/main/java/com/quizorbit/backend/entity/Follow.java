package com.quizorbit.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "follows")
public class Follow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The student who is following
    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    // The tutor being followed
    @ManyToOne
    @JoinColumn(name = "tutor_id", nullable = false)
    private User tutor;

    @Column(name = "followed_at")
    private LocalDateTime followedAt;

    @PrePersist
    public void prePersist() {
        this.followedAt = LocalDateTime.now();
    }
}