package com.example.scrumcoreservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "sprint_backlog_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(SprintBacklogItem.SprintBacklogItemId.class)
public class SprintBacklogItem {

    @Id
    @Column(name = "sprint_id")
    private Long sprintId;

    @Id
    @Column(name = "backlog_item_id")
    private Long backlogItemId;

    @Column(name = "committed_points")
    private Integer committedPoints;

    @Column(name = "actual_points")
    private Integer actualPoints;

    @Column(name = "added_at")
    private LocalDateTime addedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SprintBacklogItemId implements Serializable {
        private Long sprintId;
        private Long backlogItemId;
    }
}
