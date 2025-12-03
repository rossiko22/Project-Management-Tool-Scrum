package com.example.scrumcoreservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskEvent {
    private Long taskId;
    private Long backlogItemId;
    private Long sprintId;
    private Long projectId;
    private String title;
    private String description;
    private String status; // TO_DO, IN_PROGRESS, REVIEW, DONE
    private Long assigneeId;
    private String assigneeName;
    private BigDecimal estimatedHours;
    private BigDecimal actualHours;
    private String action; // CREATED, ASSIGNED, STATUS_CHANGED, UPDATED
    private Instant timestamp;
    private Long performedBy;
}
