package com.example.scrumcoreservice.controller;

import com.example.scrumcoreservice.dto.ApprovalRequestDto;
import com.example.scrumcoreservice.dto.ApprovalResponseDto;
import com.example.scrumcoreservice.dto.BacklogItemApprovalDto;
import com.example.scrumcoreservice.security.UserPrincipal;
import com.example.scrumcoreservice.service.ApprovalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/approvals")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Backlog Item Approvals", description = "Developer approval workflow for sprint planning")
public class ApprovalController {

    private final ApprovalService approvalService;

    @PostMapping("/request")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Request team member approvals",
               description = "Team member requests other team members to approve a backlog item for sprint")
    public ResponseEntity<Void> requestApprovals(
            @Valid @RequestBody ApprovalRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {

        approvalService.requestApprovals(
                request.getBacklogItemId(),
                request.getSprintId(),
                request.getAssignedDeveloperIds(),
                principal.getUserId(), // Pass requester ID
                principal.getRoles().isEmpty() ? "DEVELOPER" : principal.getRoles().get(0) // Pass requester role
        );

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }


    @PostMapping("/{backlogItemId}/sprint/{sprintId}/approve")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Approve backlog item for sprint",
               description = "Team member approves a backlog item to be included in sprint")
    public ResponseEntity<BacklogItemApprovalDto> approveItem(
            @PathVariable Long backlogItemId,
            @PathVariable Long sprintId,
            @AuthenticationPrincipal UserPrincipal principal) {

        BacklogItemApprovalDto approval = approvalService.approveSprintItem(
                backlogItemId,
                sprintId,
                principal.getUserId()
        );

        return ResponseEntity.ok(approval);
    }

    @PostMapping("/{backlogItemId}/sprint/{sprintId}/reject")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Reject backlog item for sprint",
               description = "Team member rejects a backlog item from being included in sprint")
    public ResponseEntity<BacklogItemApprovalDto> rejectItem(
            @PathVariable Long backlogItemId,
            @PathVariable Long sprintId,
            @RequestBody ApprovalResponseDto response,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (response.getRejectionReason() == null || response.getRejectionReason().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        BacklogItemApprovalDto approval = approvalService.rejectSprintItem(
                backlogItemId,
                sprintId,
                principal.getUserId(),
                response.getRejectionReason()
        );

        return ResponseEntity.ok(approval);
    }

    @GetMapping("/my-pending")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get my pending approvals",
               description = "Get all pending approval requests for the current team member")
    public ResponseEntity<List<BacklogItemApprovalDto>> getMyPendingApprovals(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<BacklogItemApprovalDto> approvals =
                approvalService.getPendingApprovalsForDeveloper(principal.getUserId());

        return ResponseEntity.ok(approvals);
    }

    @GetMapping("/item/{backlogItemId}/sprint/{sprintId}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get approvals for backlog item",
               description = "Get all approval requests for a specific backlog item in a sprint")
    public ResponseEntity<List<BacklogItemApprovalDto>> getApprovalsForItem(
            @PathVariable Long backlogItemId,
            @PathVariable Long sprintId) {

        List<BacklogItemApprovalDto> approvals =
                approvalService.getApprovalsForItem(backlogItemId, sprintId);

        return ResponseEntity.ok(approvals);
    }
}
