package com.example.scrumcoreservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sprint_retrospectives")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintRetrospective {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sprint_id", nullable = false)
    private Long sprintId;

    @Column(name = "facilitated_by")
    private Long facilitatedBy; // Typically the Scrum Master

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // What went well during the sprint
    @ElementCollection
    @CollectionTable(name = "retrospective_went_well", joinColumns = @JoinColumn(name = "retrospective_id"))
    @Column(name = "item", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> wentWell = new ArrayList<>();

    // What could be improved
    @ElementCollection
    @CollectionTable(name = "retrospective_improvements", joinColumns = @JoinColumn(name = "retrospective_id"))
    @Column(name = "item", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> improvements = new ArrayList<>();

    // Action items for next sprint
    @ElementCollection
    @CollectionTable(name = "retrospective_action_items", joinColumns = @JoinColumn(name = "retrospective_id"))
    @Column(name = "item", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> actionItems = new ArrayList<>();

    @Column(name = "overall_notes", columnDefinition = "TEXT")
    private String overallNotes;

    @Column(name = "team_mood")
    private Integer teamMood; // 1-5 rating of team morale

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
