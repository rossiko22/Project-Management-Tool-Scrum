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
public class BacklogItemEvent {
    private Long itemId;
    private Long projectId;
    private String title;
    private String type; // STORY, EPIC, BUG, TECHNICAL_TASK
    private String status; // BACKLOG, IN_SPRINT, COMPLETED, ARCHIVED
    private Integer storyPoints;
    private String action; // CREATED, UPDATED, ESTIMATED, STATUS_CHANGED
    private Instant timestamp;
    private Long performedBy;
}
