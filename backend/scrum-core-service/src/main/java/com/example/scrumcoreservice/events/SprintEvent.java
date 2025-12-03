package com.example.scrumcoreservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintEvent {
    private Long sprintId;
    private Long projectId;
    private Long teamId;
    private String sprintName;
    private String sprintGoal;
    private String status; // PLANNED, ACTIVE, COMPLETED, CANCELLED
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer committedPoints;
    private Integer completedPoints;
    private Integer velocity;
    private Integer storiesCompleted;
    private String action; // CREATED, STARTED, COMPLETED, CANCELLED
    private Instant timestamp;
    private Long performedBy;
}
