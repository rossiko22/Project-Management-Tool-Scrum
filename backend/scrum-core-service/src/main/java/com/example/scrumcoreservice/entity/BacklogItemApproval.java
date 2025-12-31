package com.example.scrumcoreservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "backlog_item_approvals",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"backlog_item_id", "sprint_id", "developer_id"}
       ))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(BacklogItemApproval.BacklogItemApprovalId.class)
public class BacklogItemApproval {

    @Id
    @Column(name = "backlog_item_id")
    private Long backlogItemId;

    @Id
    @Column(name = "sprint_id")
    private Long sprintId;

    @Id
    @Column(name = "developer_id")
    private Long developerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @PrePersist
    protected void onCreate() {
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
    }

    public enum ApprovalStatus {
        PENDING, APPROVED, REJECTED
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BacklogItemApprovalId implements Serializable {
        private Long backlogItemId;
        private Long sprintId;
        private Long developerId;
    }
}
