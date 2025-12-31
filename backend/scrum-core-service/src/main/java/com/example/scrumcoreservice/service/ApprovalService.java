package com.example.scrumcoreservice.service;

import com.example.scrumcoreservice.dto.BacklogItemApprovalDto;
import com.example.scrumcoreservice.entity.BacklogItemApproval;
import com.example.scrumcoreservice.entity.ProductBacklogItem;
import com.example.scrumcoreservice.entity.Sprint;
import com.example.scrumcoreservice.entity.SprintBacklogItem;
import com.example.scrumcoreservice.repository.BacklogItemApprovalRepository;
import com.example.scrumcoreservice.repository.ProductBacklogItemRepository;
import com.example.scrumcoreservice.repository.SprintBacklogItemRepository;
import com.example.scrumcoreservice.repository.SprintRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApprovalService {

    private final BacklogItemApprovalRepository approvalRepository;
    private final ProductBacklogItemRepository backlogItemRepository;
    private final SprintRepository sprintRepository;
    private final SprintBacklogItemRepository sprintBacklogItemRepository;
    private final EventPublisher eventPublisher;

    /**
     * Request approval from all team members (except requester) for a backlog item to be added to sprint
     * Called by any team member when selecting items for sprint planning
     */
    @Transactional
    public void requestApprovals(Long backlogItemId, Long sprintId, List<Long> teamMemberIds, Long requesterId) {
        // Validate backlog item exists
        ProductBacklogItem item = backlogItemRepository.findById(backlogItemId)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        // Validate sprint exists and is in PLANNED status
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        if (sprint.getStatus() != Sprint.SprintStatus.PLANNED) {
            throw new RuntimeException("Can only request approvals for sprints in PLANNED status");
        }

        // Check if approvals already exist for this item/sprint combination
        List<BacklogItemApproval> existingApprovals =
                approvalRepository.findByBacklogItemIdAndSprintId(backlogItemId, sprintId);

        if (!existingApprovals.isEmpty()) {
            throw new RuntimeException("Approval requests already exist for this backlog item in this sprint");
        }

        // Create approval request for each team member EXCEPT the requester
        for (Long memberId : teamMemberIds) {
            if (memberId.equals(requesterId)) {
                log.info("Skipping approval request for requester {} for backlog item {} in sprint {}",
                        memberId, backlogItemId, sprintId);
                continue; // Skip the person who added the item
            }

            BacklogItemApproval approval = BacklogItemApproval.builder()
                    .backlogItemId(backlogItemId)
                    .sprintId(sprintId)
                    .developerId(memberId) // Using developerId field for all team members
                    .status(BacklogItemApproval.ApprovalStatus.PENDING)
                    .requestedAt(LocalDateTime.now())
                    .build();

            approvalRepository.save(approval);

            log.info("Created approval request for team member {} for backlog item {} in sprint {}",
                    memberId, backlogItemId, sprintId);
        }

        // Update backlog item status to PENDING_APPROVAL
        item.setStatus(ProductBacklogItem.ItemStatus.PENDING_APPROVAL);
        backlogItemRepository.save(item);

        log.info("Approval workflow initiated for backlog item {} in sprint {}. {} approval(s) required.",
                backlogItemId, sprintId, teamMemberIds.size() - 1); // -1 for requester
    }

    /**
     * Developer approves a backlog item for sprint
     */
    @Transactional
    public BacklogItemApprovalDto approveSprintItem(Long backlogItemId, Long sprintId, Long developerId) {
        BacklogItemApproval approval = approvalRepository
                .findByBacklogItemIdAndSprintIdAndDeveloperId(backlogItemId, sprintId, developerId)
                .orElseThrow(() -> new RuntimeException("Approval request not found"));

        if (approval.getStatus() != BacklogItemApproval.ApprovalStatus.PENDING) {
            throw new RuntimeException("Approval has already been responded to");
        }

        approval.setStatus(BacklogItemApproval.ApprovalStatus.APPROVED);
        approval.setRespondedAt(LocalDateTime.now());
        approval.setRejectionReason(null);
        approvalRepository.save(approval);

        log.info("Developer {} approved backlog item {} for sprint {}",
                developerId, backlogItemId, sprintId);

        ProductBacklogItem item = backlogItemRepository.findById(backlogItemId)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        // Publish approval given event
        com.example.scrumcoreservice.events.ApprovalEvent event =
                com.example.scrumcoreservice.events.ApprovalEvent.builder()
                        .backlogItemId(backlogItemId)
                        .backlogItemTitle(item.getTitle())
                        .sprintId(sprintId)
                        .sprintName(sprint.getName())
                        .projectId(item.getProjectId())
                        .developerId(developerId)
                        .action("APPROVED")
                        .timestamp(java.time.Instant.now())
                        .performedBy(developerId)
                        .build();
        eventPublisher.publishApprovalEvent(event);

        // Check if all approvals are now complete
        checkAndProcessAllApprovals(backlogItemId, sprintId);

        return BacklogItemApprovalDto.fromEntity(approval);
    }

    /**
     * Developer rejects a backlog item for sprint
     */
    @Transactional
    public BacklogItemApprovalDto rejectSprintItem(Long backlogItemId, Long sprintId, Long developerId, String reason) {
        BacklogItemApproval approval = approvalRepository
                .findByBacklogItemIdAndSprintIdAndDeveloperId(backlogItemId, sprintId, developerId)
                .orElseThrow(() -> new RuntimeException("Approval request not found"));

        if (approval.getStatus() != BacklogItemApproval.ApprovalStatus.PENDING) {
            throw new RuntimeException("Approval has already been responded to");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("Rejection reason is required");
        }

        approval.setStatus(BacklogItemApproval.ApprovalStatus.REJECTED);
        approval.setRespondedAt(LocalDateTime.now());
        approval.setRejectionReason(reason);
        approvalRepository.save(approval);

        log.info("Developer {} rejected backlog item {} for sprint {} with reason: {}",
                developerId, backlogItemId, sprintId, reason);

        ProductBacklogItem item = backlogItemRepository.findById(backlogItemId)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        // Publish rejection event
        com.example.scrumcoreservice.events.ApprovalEvent event =
                com.example.scrumcoreservice.events.ApprovalEvent.builder()
                        .backlogItemId(backlogItemId)
                        .backlogItemTitle(item.getTitle())
                        .sprintId(sprintId)
                        .sprintName(sprint.getName())
                        .projectId(item.getProjectId())
                        .developerId(developerId)
                        .action("REJECTED")
                        .rejectionReason(reason)
                        .timestamp(java.time.Instant.now())
                        .performedBy(developerId)
                        .build();
        eventPublisher.publishApprovalEvent(event);

        // Process rejection - item cannot be added to sprint
        processRejection(backlogItemId, sprintId);

        return BacklogItemApprovalDto.fromEntity(approval);
    }

    /**
     * Check if all developers have approved and move item to sprint if so
     */
    private void checkAndProcessAllApprovals(Long backlogItemId, Long sprintId) {
        boolean allApproved = approvalRepository.areAllApprovalsApproved(backlogItemId, sprintId);

        if (allApproved) {
            // All developers approved - add item to sprint
            ProductBacklogItem item = backlogItemRepository.findById(backlogItemId)
                    .orElseThrow(() -> new RuntimeException("Backlog item not found"));

            // Create sprint backlog item entry
            SprintBacklogItem sprintBacklogItem = SprintBacklogItem.builder()
                    .sprintId(sprintId)
                    .backlogItemId(backlogItemId)
                    .committedPoints(item.getStoryPoints())
                    .build();

            sprintBacklogItemRepository.save(sprintBacklogItem);

            // Update item status to SPRINT_READY
            item.setStatus(ProductBacklogItem.ItemStatus.SPRINT_READY);
            backlogItemRepository.save(item);

            log.info("All approvals received for backlog item {} in sprint {}. Item added to sprint.",
                    backlogItemId, sprintId);

            Sprint sprint = sprintRepository.findById(sprintId)
                    .orElseThrow(() -> new RuntimeException("Sprint not found"));

            // Publish ALL_APPROVED event - notify PO that item is ready for sprint
            com.example.scrumcoreservice.events.ApprovalEvent event =
                    com.example.scrumcoreservice.events.ApprovalEvent.builder()
                            .backlogItemId(backlogItemId)
                            .backlogItemTitle(item.getTitle())
                            .sprintId(sprintId)
                            .sprintName(sprint.getName())
                            .projectId(item.getProjectId())
                            .action("ALL_APPROVED")
                            .timestamp(java.time.Instant.now())
                            .build();
            eventPublisher.publishApprovalEvent(event);
        }
    }

    /**
     * Process rejection - return item to backlog and remove from sprint
     */
    private void processRejection(Long backlogItemId, Long sprintId) {
        ProductBacklogItem item = backlogItemRepository.findById(backlogItemId)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        // Return item to BACKLOG status
        item.setStatus(ProductBacklogItem.ItemStatus.BACKLOG);
        backlogItemRepository.save(item);

        // Remove item from sprint if it was added
        sprintBacklogItemRepository.deleteBySprintIdAndBacklogItemId(sprintId, backlogItemId);

        // Delete all approval requests for this item/sprint (they're no longer relevant)
        approvalRepository.deleteByBacklogItemIdAndSprintId(backlogItemId, sprintId);

        log.info("Backlog item {} rejected for sprint {}. Removed from sprint and returned to backlog.",
                backlogItemId, sprintId);
    }

    /**
     * Get all pending approvals for a developer
     */
    public List<BacklogItemApprovalDto> getPendingApprovalsForDeveloper(Long developerId) {
        return approvalRepository.findByDeveloperIdAndStatus(
                developerId, BacklogItemApproval.ApprovalStatus.PENDING)
                .stream()
                .map(BacklogItemApprovalDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get all approvals for a specific backlog item in a sprint
     */
    public List<BacklogItemApprovalDto> getApprovalsForItem(Long backlogItemId, Long sprintId) {
        return approvalRepository.findByBacklogItemIdAndSprintId(backlogItemId, sprintId)
                .stream()
                .map(BacklogItemApprovalDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Check if all approvals for an item are approved (used before sprint start)
     */
    public boolean areAllApprovalsComplete(Long backlogItemId, Long sprintId) {
        return approvalRepository.areAllApprovalsApproved(backlogItemId, sprintId);
    }

    /**
     * Cancel all pending approvals for a sprint
     * Used when sprint is cancelled or deleted
     */
    @Transactional
    public void cancelApprovalsForSprint(Long sprintId) {
        List<BacklogItemApproval> approvals = approvalRepository.findBySprintId(sprintId);

        for (BacklogItemApproval approval : approvals) {
            if (approval.getStatus() == BacklogItemApproval.ApprovalStatus.PENDING) {
                // Return items to backlog
                ProductBacklogItem item = backlogItemRepository.findById(approval.getBacklogItemId())
                        .orElse(null);
                if (item != null && item.getStatus() == ProductBacklogItem.ItemStatus.PENDING_APPROVAL) {
                    item.setStatus(ProductBacklogItem.ItemStatus.BACKLOG);
                    backlogItemRepository.save(item);
                }
            }
        }

        // Delete all approvals for this sprint
        for (BacklogItemApproval approval : approvals) {
            approvalRepository.delete(approval);
        }

        log.info("Cancelled all approvals for sprint {}", sprintId);
    }
}
