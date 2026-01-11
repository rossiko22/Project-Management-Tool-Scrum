package com.example.scrumcoreservice.service;

import com.example.scrumcoreservice.dto.BacklogItemDto;
import com.example.scrumcoreservice.dto.CreateBacklogItemRequest;
import com.example.scrumcoreservice.entity.ProductBacklogItem;
import com.example.scrumcoreservice.entity.Sprint;
import com.example.scrumcoreservice.events.BacklogItemEvent;
import com.example.scrumcoreservice.repository.ProductBacklogItemRepository;
import com.example.scrumcoreservice.repository.SprintRepository;
import com.example.scrumcoreservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BacklogService {

    private final ProductBacklogItemRepository backlogItemRepository;
    private final SprintRepository sprintRepository;
    private final JwtUtil jwtUtil;
    private final EventPublisher eventPublisher;
    private final ApprovalService approvalService;

    @Transactional
    public BacklogItemDto createBacklogItem(CreateBacklogItemRequest request, Long userId, String userRole) {
        // Validate status - only BACKLOG or SPRINT_READY allowed
        ProductBacklogItem.ItemStatus initialStatus = ProductBacklogItem.ItemStatus.BACKLOG;

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            String requestedStatus = request.getStatus().toUpperCase();
            if (!requestedStatus.equals("BACKLOG") && !requestedStatus.equals("SPRINT_READY")) {
                throw new RuntimeException("Invalid status. Only BACKLOG or SPRINT_READY allowed during creation.");
            }
            initialStatus = ProductBacklogItem.ItemStatus.valueOf(requestedStatus);
        }

        // If SPRINT_READY status requested, validate sprint
        if (initialStatus == ProductBacklogItem.ItemStatus.SPRINT_READY) {
            if (request.getSprintId() == null) {
                throw new RuntimeException("Sprint ID is required when status is SPRINT_READY");
            }

            // Validate sprint exists and is in PLANNED state
            Sprint sprint = sprintRepository.findById(request.getSprintId())
                    .orElseThrow(() -> new RuntimeException("Sprint not found"));

            if (sprint.getStatus() != Sprint.SprintStatus.PLANNED) {
                throw new RuntimeException("Can only add items to sprints in PLANNED status");
            }

            // Validate sprint belongs to same project
            if (!sprint.getProjectId().equals(request.getProjectId())) {
                throw new RuntimeException("Sprint and backlog item must belong to the same project");
            }
        }

        Integer maxPosition = backlogItemRepository.findMaxPositionByProjectId(request.getProjectId());
        int newPosition = (maxPosition != null) ? maxPosition + 1 : 0;

        ProductBacklogItem item = ProductBacklogItem.builder()
                .projectId(request.getProjectId())
                .title(request.getTitle())
                .description(request.getDescription())
                .type(ProductBacklogItem.ItemType.valueOf(request.getType()))
                .storyPoints(request.getStoryPoints())
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .position(newPosition)
                .status(initialStatus)
                .acceptanceCriteria(request.getAcceptanceCriteria())
                .createdBy(userId)
                .createdByRole(userRole)
                .build();

        item = backlogItemRepository.save(item);

        // Handle SPRINT_READY status based on user role
        if (initialStatus == ProductBacklogItem.ItemStatus.SPRINT_READY) {
            if ("PRODUCT_OWNER".equals(userRole)) {
                // Product Owner can add items directly to sprint without approval
                approvalService.addItemToSprintDirectly(item.getId(), request.getSprintId());

                // Reload the item to get updated status (will be IN_SPRINT)
                item = backlogItemRepository.findById(item.getId())
                        .orElseThrow(() -> new RuntimeException("Failed to reload created item"));
            } else {
                // Developer needs approval from Product Owner only
                if (request.getAssignedDeveloperIds() == null || request.getAssignedDeveloperIds().isEmpty()) {
                    throw new RuntimeException("Team member IDs are required when Developer creates SPRINT_READY item");
                }

                approvalService.requestApprovals(
                        item.getId(),
                        request.getSprintId(),
                        request.getAssignedDeveloperIds(),
                        userId,
                        userRole
                );

                // Reload the item to get updated status (will be PENDING_APPROVAL)
                item = backlogItemRepository.findById(item.getId())
                        .orElseThrow(() -> new RuntimeException("Failed to reload created item"));
            }
        }

        // Publish backlog item created event
        BacklogItemEvent event = BacklogItemEvent.builder()
                .itemId(item.getId())
                .projectId(item.getProjectId())
                .title(item.getTitle())
                .type(item.getType().name())
                .status(item.getStatus().name())
                .storyPoints(item.getStoryPoints())
                .action("CREATED")
                .timestamp(Instant.now())
                .performedBy(userId)
                .build();
        eventPublisher.publishBacklogItemEvent(event);

        return BacklogItemDto.fromEntity(item);
    }

    public List<BacklogItemDto> getProjectBacklog(Long projectId) {
        return backlogItemRepository.findByProjectIdOrderByPositionAsc(projectId)
                .stream()
                .map(BacklogItemDto::fromEntity)
                .collect(Collectors.toList());
    }

    public BacklogItemDto getBacklogItem(Long id) {
        ProductBacklogItem item = backlogItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));
        return BacklogItemDto.fromEntity(item);
    }

    @Transactional
    public BacklogItemDto updateBacklogItem(Long id, CreateBacklogItemRequest request, String userRole) {
        ProductBacklogItem item = backlogItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        boolean storyPointsChanged = item.getStoryPoints() != null &&
                                     !item.getStoryPoints().equals(request.getStoryPoints());

        ProductBacklogItem.ItemStatus oldStatus = item.getStatus();

        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setType(ProductBacklogItem.ItemType.valueOf(request.getType()));
        item.setStoryPoints(request.getStoryPoints());
        item.setPriority(request.getPriority());
        item.setAcceptanceCriteria(request.getAcceptanceCriteria());

        // Handle status change to SPRINT_READY
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            String requestedStatus = request.getStatus().toUpperCase();
            ProductBacklogItem.ItemStatus newStatus = ProductBacklogItem.ItemStatus.valueOf(requestedStatus);

            // If changing from BACKLOG to SPRINT_READY, validate and handle based on user role
            if (oldStatus == ProductBacklogItem.ItemStatus.BACKLOG &&
                newStatus == ProductBacklogItem.ItemStatus.SPRINT_READY) {

                if (request.getSprintId() == null) {
                    throw new RuntimeException("Sprint ID is required when status is SPRINT_READY");
                }

                // Validate sprint exists and is in PLANNED state
                Sprint sprint = sprintRepository.findById(request.getSprintId())
                        .orElseThrow(() -> new RuntimeException("Sprint not found"));

                if (sprint.getStatus() != Sprint.SprintStatus.PLANNED) {
                    throw new RuntimeException("Can only add items to sprints in PLANNED status");
                }

                // Validate sprint belongs to same project
                if (!sprint.getProjectId().equals(item.getProjectId())) {
                    throw new RuntimeException("Sprint and backlog item must belong to the same project");
                }

                // Set status to SPRINT_READY initially
                item.setStatus(ProductBacklogItem.ItemStatus.SPRINT_READY);
                item = backlogItemRepository.save(item);

                // Handle based on user role
                if ("PRODUCT_OWNER".equals(userRole)) {
                    // Product Owner can add items directly to sprint without approval
                    approvalService.addItemToSprintDirectly(item.getId(), request.getSprintId());

                    // Reload the item to get updated status (will be IN_SPRINT)
                    item = backlogItemRepository.findById(item.getId())
                            .orElseThrow(() -> new RuntimeException("Failed to reload updated item"));
                } else {
                    // Developer needs approval from Product Owner only
                    if (request.getAssignedDeveloperIds() == null || request.getAssignedDeveloperIds().isEmpty()) {
                        throw new RuntimeException("Team member IDs are required when Developer updates to SPRINT_READY");
                    }

                    approvalService.requestApprovals(
                            item.getId(),
                            request.getSprintId(),
                            request.getAssignedDeveloperIds(),
                            item.getCreatedBy(),
                            userRole
                    );

                    // Reload the item to get updated status (will be PENDING_APPROVAL)
                    item = backlogItemRepository.findById(item.getId())
                            .orElseThrow(() -> new RuntimeException("Failed to reload updated item"));
                }
            } else {
                // For other status changes, just update the status
                item.setStatus(newStatus);
            }
        }

        item = backlogItemRepository.save(item);

        // Publish backlog item updated or estimated event
        String action = storyPointsChanged ? "ESTIMATED" : "UPDATED";
        BacklogItemEvent event = BacklogItemEvent.builder()
                .itemId(item.getId())
                .projectId(item.getProjectId())
                .title(item.getTitle())
                .type(item.getType().name())
                .status(item.getStatus().name())
                .storyPoints(item.getStoryPoints())
                .action(action)
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishBacklogItemEvent(event);

        return BacklogItemDto.fromEntity(item);
    }

    @Transactional
    public void deleteBacklogItem(Long id) {
        backlogItemRepository.deleteById(id);
    }

    @Transactional
    public void reorderBacklog(Long projectId, List<Long> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            Long itemId = orderedIds.get(i);
            final int position = i;
            backlogItemRepository.findById(itemId).ifPresent(item -> {
                item.setPosition(position);
                backlogItemRepository.save(item);
            });
        }
    }

    @Transactional
    public BacklogItemDto acceptBacklogItem(Long id, Long productOwnerId) {
        ProductBacklogItem item = backlogItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        // Item should be in DONE or PENDING_ACCEPTANCE status
        if (item.getStatus() != ProductBacklogItem.ItemStatus.DONE &&
            item.getStatus() != ProductBacklogItem.ItemStatus.PENDING_ACCEPTANCE) {
            throw new RuntimeException("Item must be DONE before it can be accepted");
        }

        item.setStatus(ProductBacklogItem.ItemStatus.ACCEPTED);
        item.setReviewedBy(productOwnerId);
        item.setReviewedAt(LocalDateTime.now());
        item.setRejectionReason(null); // Clear any previous rejection reason

        item = backlogItemRepository.save(item);

        // Publish backlog item accepted event
        BacklogItemEvent event = BacklogItemEvent.builder()
                .itemId(item.getId())
                .projectId(item.getProjectId())
                .title(item.getTitle())
                .type(item.getType().name())
                .status(item.getStatus().name())
                .storyPoints(item.getStoryPoints())
                .action("ACCEPTED")
                .timestamp(Instant.now())
                .performedBy(productOwnerId)
                .build();
        eventPublisher.publishBacklogItemEvent(event);

        return BacklogItemDto.fromEntity(item);
    }

    @Transactional
    public BacklogItemDto rejectBacklogItem(Long id, Long productOwnerId, String reason) {
        ProductBacklogItem item = backlogItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        // Item should be in DONE or PENDING_ACCEPTANCE status
        if (item.getStatus() != ProductBacklogItem.ItemStatus.DONE &&
            item.getStatus() != ProductBacklogItem.ItemStatus.PENDING_ACCEPTANCE) {
            throw new RuntimeException("Item must be DONE before it can be rejected");
        }

        item.setStatus(ProductBacklogItem.ItemStatus.REJECTED);
        item.setReviewedBy(productOwnerId);
        item.setReviewedAt(LocalDateTime.now());
        item.setRejectionReason(reason);

        item = backlogItemRepository.save(item);

        // Publish backlog item rejected event
        BacklogItemEvent event = BacklogItemEvent.builder()
                .itemId(item.getId())
                .projectId(item.getProjectId())
                .title(item.getTitle())
                .type(item.getType().name())
                .status(item.getStatus().name())
                .storyPoints(item.getStoryPoints())
                .action("REJECTED")
                .timestamp(Instant.now())
                .performedBy(productOwnerId)
                .build();
        eventPublisher.publishBacklogItemEvent(event);

        return BacklogItemDto.fromEntity(item);
    }
}
