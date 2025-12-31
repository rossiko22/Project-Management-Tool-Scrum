package com.example.scrumcoreservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalEvent {

    private Long approvalId; // For tracking
    private Long backlogItemId;
    private String backlogItemTitle;
    private Long sprintId;
    private String sprintName;
    private Long projectId;
    private Long developerId;  // Developer being notified or who responded
    private String action;     // APPROVAL_REQUESTED, APPROVED, REJECTED, ALL_APPROVED
    private String rejectionReason;  // Only for REJECTED action
    private Instant timestamp;
    private Long performedBy;  // Who triggered this event (PO for requests, Dev for responses)
}
