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

    // Collaboration service URL for notifications (using 127.0.0.1 to force IPv4)
    private static final String COLLABORATION_SERVICE_URL = "http://127.0.0.1:3000";

    /**
     * Add item to sprint directly without approval (Product Owner only)
     */
    @Transactional
    public void addItemToSprintDirectly(Long backlogItemId, Long sprintId) {
        // Validate backlog item exists
        ProductBacklogItem item = backlogItemRepository.findById(backlogItemId)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        // Validate sprint exists and is in PLANNED status
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        if (sprint.getStatus() != Sprint.SprintStatus.PLANNED) {
            throw new RuntimeException("Can only add items to sprints in PLANNED status");
        }

        // Create sprint backlog item entry
        SprintBacklogItem sprintBacklogItem = SprintBacklogItem.builder()
                .sprintId(sprintId)
                .backlogItemId(backlogItemId)
                .committedPoints(item.getStoryPoints())
                .build();

        sprintBacklogItemRepository.save(sprintBacklogItem);

        // Update item status to IN_SPRINT
        item.setStatus(ProductBacklogItem.ItemStatus.IN_SPRINT);
        backlogItemRepository.save(item);

        log.info("Product Owner added backlog item {} to sprint {} directly without approval.",
                backlogItemId, sprintId);
    }

    /**
     * Request approval from Product Owner for a backlog item to be added to sprint
     * Called by Developer when selecting items for sprint planning
     */
    @Transactional
    public void requestApprovals(Long backlogItemId, Long sprintId, List<Long> teamMemberIds, Long requesterId, String requesterRole) {
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

        log.info("🔔 Starting approval workflow for backlog item {} ('{}')", backlogItemId, item.getTitle());
        log.info("   Requester ID: {}, Team members to notify: {}", requesterId, teamMemberIds);

        // When Developer requests, only Product Owner needs to approve
        // Find Product Owner from team members list
        for (Long memberId : teamMemberIds) {
            // Skip null member IDs
            if (memberId == null) {
                log.warn("Skipping null member ID in approval request for backlog item {} in sprint {}",
                        backlogItemId, sprintId);
                continue;
            }

            // Skip the requester (Developer)
            if (memberId.equals(requesterId)) {
                log.info("Skipping approval request for requester {} for backlog item {} in sprint {}",
                        memberId, backlogItemId, sprintId);
                continue;
            }

            // Only create approval for Product Owner (we assume PO is in the teamMemberIds list)
            // In practice, the frontend should only send the PO's ID when a Developer creates the item
            BacklogItemApproval approval = BacklogItemApproval.builder()
                    .backlogItemId(backlogItemId)
                    .sprintId(sprintId)
                    .developerId(memberId) // Using developerId field for Product Owner
                    .status(BacklogItemApproval.ApprovalStatus.PENDING)
                    .requestedAt(LocalDateTime.now())
                    .build();

            approvalRepository.save(approval);

            log.info("✅ Created approval request for Product Owner {} for backlog item {} in sprint {}",
                    memberId, backlogItemId, sprintId);

            // Send notification to Product Owner about the approval request
            sendNotification(
                memberId,
                "BACKLOG_ITEM_APPROVAL_REQUEST",
                "Approval Request",
                String.format("Developer requested approval: Please review '%s' for sprint '%s'",
                    item.getTitle(), sprint.getName()),
                "BACKLOG_ITEM",
                backlogItemId
            );

            log.info("🔔 Notification sent to Product Owner {}", memberId);
        }

        // Update backlog item status to PENDING_APPROVAL
        item.setStatus(ProductBacklogItem.ItemStatus.PENDING_APPROVAL);
        backlogItemRepository.save(item);

        log.info("Approval workflow initiated for backlog item {} in sprint {}. Product Owner approval required.",
                backlogItemId, sprintId);
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

        // Send notification to the developer who created the item
        if (item.getCreatedBy() != null && !item.getCreatedBy().equals(developerId)) {
            log.info("🔔 Sending approval notification to developer {} for item '{}'", item.getCreatedBy(), item.getTitle());
            sendNotification(
                item.getCreatedBy(),
                "BACKLOG_ITEM_APPROVED",
                "Item Approved",
                String.format("Product Owner approved your item '%s' for sprint '%s'", item.getTitle(), sprint.getName()),
                "BACKLOG_ITEM",
                backlogItemId
            );
        } else {
            log.info("ℹ️ Not sending approval notification (creator={}, approver={})", item.getCreatedBy(), developerId);
        }

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

        // Send notification to the developer who created the item
        if (item.getCreatedBy() != null && !item.getCreatedBy().equals(developerId)) {
            log.info("🔔 Sending rejection notification to developer {} for item '{}'", item.getCreatedBy(), item.getTitle());
            sendNotification(
                item.getCreatedBy(),
                "BACKLOG_ITEM_REJECTED",
                "Item Rejected",
                String.format("Product Owner rejected your item '%s' for sprint '%s'. Reason: %s",
                    item.getTitle(), sprint.getName(), reason),
                "BACKLOG_ITEM",
                backlogItemId
            );
        } else {
            log.info("ℹ️ Not sending rejection notification (creator={}, rejector={})", item.getCreatedBy(), developerId);
        }

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

            // Update item status to IN_SPRINT
            item.setStatus(ProductBacklogItem.ItemStatus.IN_SPRINT);
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

    /**
     * Send notification to collaboration service
     */
    private void sendNotification(Long recipientId, String notificationType, String title, String message,
                                   String entityType, Long entityId) {
        try {
            // Build payload as Map for proper JSON serialization
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("recipientId", recipientId);
            payload.put("type", notificationType);

            java.util.Map<String, Object> payloadData = new java.util.HashMap<>();
            payloadData.put("title", title);
            payloadData.put("message", message);
            payloadData.put("entityType", entityType);
            payloadData.put("entityId", entityId);

            payload.put("payload", payloadData);

            // Use Jackson ObjectMapper for JSON serialization
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String jsonPayload = mapper.writeValueAsString(payload);

            log.debug("Sending notification: {}", jsonPayload);

            // Use simple URLConnection for more reliable HTTP communication
            java.net.URL url = new java.net.URL(COLLABORATION_SERVICE_URL + "/notifications");
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setDoOutput(true);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(10000);

            try (java.io.OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonPayload.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode >= 200 && responseCode < 300) {
                log.info("✅ Notification sent to user {} (type: {})", recipientId, notificationType);
            } else {
                java.io.BufferedReader br = new java.io.BufferedReader(
                    new java.io.InputStreamReader(conn.getErrorStream(), java.nio.charset.StandardCharsets.UTF_8));
                String responseLine;
                StringBuilder responseBody = new StringBuilder();
                while ((responseLine = br.readLine()) != null) {
                    responseBody.append(responseLine.trim());
                }
                log.warn("⚠️ Failed to send notification: HTTP {} - {}", responseCode, responseBody.toString());
            }
        } catch (Exception e) {
            log.error("⚠️ Failed to send notification to user {}: {}", recipientId, e.getMessage());
            e.printStackTrace();
        }
    }
}
