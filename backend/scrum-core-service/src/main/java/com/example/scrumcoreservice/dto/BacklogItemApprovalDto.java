package com.example.scrumcoreservice.dto;

import com.example.scrumcoreservice.entity.BacklogItemApproval;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BacklogItemApprovalDto {

    private Long backlogItemId;
    private Long sprintId;
    private Long developerId;
    private String status;
    private String rejectionReason;
    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;

    // Additional fields for display
    private String backlogItemTitle;
    private String sprintName;
    private String developerName;

    public static BacklogItemApprovalDto fromEntity(BacklogItemApproval approval) {
        return BacklogItemApprovalDto.builder()
                .backlogItemId(approval.getBacklogItemId())
                .sprintId(approval.getSprintId())
                .developerId(approval.getDeveloperId())
                .status(approval.getStatus().name())
                .rejectionReason(approval.getRejectionReason())
                .requestedAt(approval.getRequestedAt())
                .respondedAt(approval.getRespondedAt())
                .build();
    }
}
