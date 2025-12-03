package com.example.identityservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectEvent {
    private Long projectId;
    private String projectName;
    private String description;
    private Long organizationId;
    private String action; // CREATED, UPDATED, ARCHIVED
    private List<Long> teamIds;
    private Instant timestamp;
    private Long performedBy;
}
