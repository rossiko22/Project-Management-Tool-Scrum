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
public class TeamEvent {
    private Long teamId;
    private String teamName;
    private Long projectId;
    private String action; // CREATED, UPDATED, MEMBER_ADDED, MEMBER_REMOVED
    private Long userId; // For member events
    private String userRole; // For member events
    private List<Long> memberIds;
    private Instant timestamp;
    private Long performedBy;
}
