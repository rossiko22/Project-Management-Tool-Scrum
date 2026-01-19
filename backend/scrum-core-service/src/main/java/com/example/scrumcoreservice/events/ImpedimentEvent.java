package com.example.scrumcoreservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpedimentEvent {
    private Long impedimentId;
    private Long sprintId;
    private Long projectId;
    private String title;
    private String description;
    private String status; // OPEN, IN_PROGRESS, RESOLVED
    private Long reportedBy;
    private Long assignedTo;
    private Long resolvedBy;
    private String resolution;
    private String action; // CREATED, ASSIGNED, STATUS_CHANGED, RESOLVED, DELETED
    private Instant timestamp;
    private Long performedBy;
}
