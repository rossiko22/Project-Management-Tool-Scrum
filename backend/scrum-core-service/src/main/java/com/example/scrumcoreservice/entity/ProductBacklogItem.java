package com.example.scrumcoreservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_backlog_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductBacklogItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ItemType type;

    @Column(name = "story_points")
    private Integer storyPoints;

    @Builder.Default
    private Integer priority = 0;

    @Column(nullable = false)
    private Integer position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ItemStatus status = ItemStatus.BACKLOG;

    @Column(name = "acceptance_criteria", columnDefinition = "TEXT")
    private String acceptanceCriteria;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_by_role", length = 50)
    private String createdByRole;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "board_column", length = 20)
    private BoardColumn boardColumn;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ItemType {
        STORY, EPIC, BUG, TECHNICAL_TASK
    }

    // IN_SPRINT can be removed
    public enum ItemStatus {
        BACKLOG, PENDING_APPROVAL, SPRINT_READY, IN_SPRINT, DONE, PENDING_ACCEPTANCE, ACCEPTED, REJECTED
    }

    public enum BoardColumn {
        TO_DO, IN_PROGRESS, REVIEW, DONE
    }
}
