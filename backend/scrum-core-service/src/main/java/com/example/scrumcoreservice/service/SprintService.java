package com.example.scrumcoreservice.service;

import com.example.scrumcoreservice.dto.CreateSprintRequest;
import com.example.scrumcoreservice.dto.SprintDto;
import com.example.scrumcoreservice.entity.ProductBacklogItem;
import com.example.scrumcoreservice.entity.Sprint;
import com.example.scrumcoreservice.entity.SprintBacklogItem;
import com.example.scrumcoreservice.events.SprintEvent;
import com.example.scrumcoreservice.repository.ProductBacklogItemRepository;
import com.example.scrumcoreservice.repository.SprintBacklogItemRepository;
import com.example.scrumcoreservice.repository.SprintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final SprintBacklogItemRepository sprintBacklogItemRepository;
    private final ProductBacklogItemRepository backlogItemRepository;
    private final EventPublisher eventPublisher;
    private final ApprovalService approvalService;

    @Transactional
    public SprintDto createSprint(CreateSprintRequest request, Long userId) {
        Sprint sprint = Sprint.builder()
                .projectId(request.getProjectId())
                .name(request.getName())
                .goal(request.getGoal())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .lengthWeeks(request.getLengthWeeks())
                .status(Sprint.SprintStatus.PLANNED)
                .teamCapacity(request.getTeamCapacity())
                .createdBy(userId)
                .build();

        sprint = sprintRepository.save(sprint);

        // Publish sprint created event
        SprintEvent event = SprintEvent.builder()
                .sprintId(sprint.getId())
                .projectId(sprint.getProjectId())
                .teamId(request.getTeamId())
                .sprintName(sprint.getName())
                .sprintGoal(sprint.getGoal())
                .status(sprint.getStatus().name())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .action("CREATED")
                .timestamp(Instant.now())
                .performedBy(userId)
                .build();
        eventPublisher.publishSprintEvent(event);

        return SprintDto.fromEntity(sprint);
    }

    public List<SprintDto> getProjectSprints(Long projectId) {
        return sprintRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(SprintDto::fromEntity)
                .collect(Collectors.toList());
    }

    public SprintDto getSprint(Long id) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));
        return SprintDto.fromEntity(sprint);
    }

    public SprintDto getActiveSprint(Long projectId) {
        return sprintRepository.findFirstByProjectIdAndStatusOrderByStartedAtDesc(projectId, Sprint.SprintStatus.ACTIVE)
                .map(SprintDto::fromEntity)
                .orElse(null);
    }

    @Transactional
    public SprintDto startSprint(Long id) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        if (sprint.getStatus() != Sprint.SprintStatus.PLANNED) {
            throw new RuntimeException("Sprint must be in PLANNED status to start");
        }

        // CRITICAL SCRUM VALIDATION: Sprint must have a defined Sprint Goal
        if (sprint.getGoal() == null || sprint.getGoal().trim().isEmpty()) {
            throw new RuntimeException("Cannot start sprint without a Sprint Goal. Please define a goal first.");
        }

        // CRITICAL SCRUM VALIDATION: Sprint must have at least one backlog item
        List<SprintBacklogItem> sprintItems = sprintBacklogItemRepository.findBySprintId(id);
        if (sprintItems.isEmpty()) {
            throw new RuntimeException("Cannot start sprint without at least one backlog item. " +
                    "Please add items to the sprint.");
        }

        // CRITICAL SCRUM VALIDATION: All items in sprint must be ready (SPRINT_READY or IN_SPRINT status)
        for (SprintBacklogItem sbi : sprintItems) {
            ProductBacklogItem item = backlogItemRepository.findById(sbi.getBacklogItemId())
                    .orElseThrow(() -> new RuntimeException("Backlog item not found"));

            // Allow both SPRINT_READY and IN_SPRINT statuses
            if (item.getStatus() != ProductBacklogItem.ItemStatus.SPRINT_READY &&
                item.getStatus() != ProductBacklogItem.ItemStatus.IN_SPRINT) {
                throw new RuntimeException("Cannot start sprint: Backlog item '" + item.getTitle() +
                        "' is not ready for sprint (status: " + item.getStatus() + "). " +
                        "All items must have SPRINT_READY or IN_SPRINT status before sprint can start.");
            }
        }

        sprint.setStatus(Sprint.SprintStatus.ACTIVE);
        sprint.setStartedAt(LocalDateTime.now());

        // Update all backlog items in this sprint to IN_SPRINT status and set to TO_DO column
        int committedPoints = 0;
        for (SprintBacklogItem sbi : sprintItems) {
            backlogItemRepository.findById(sbi.getBacklogItemId()).ifPresent(item -> {
                // Update to IN_SPRINT if not already (some items may already be IN_SPRINT from approval)
                if (item.getStatus() != ProductBacklogItem.ItemStatus.IN_SPRINT) {
                    item.setStatus(ProductBacklogItem.ItemStatus.IN_SPRINT);
                }
                item.setBoardColumn(ProductBacklogItem.BoardColumn.TO_DO); // All items start in TO_DO
                backlogItemRepository.save(item);
            });
            committedPoints += (sbi.getCommittedPoints() != null ? sbi.getCommittedPoints() : 0);
        }

        sprint = sprintRepository.save(sprint);

        // Publish sprint started event
        SprintEvent event = SprintEvent.builder()
                .sprintId(sprint.getId())
                .projectId(sprint.getProjectId())
                .sprintName(sprint.getName())
                .sprintGoal(sprint.getGoal())
                .status(sprint.getStatus().name())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .committedPoints(committedPoints)
                .action("STARTED")
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishSprintEvent(event);

        return SprintDto.fromEntity(sprint);
    }

    @Transactional
    public SprintDto endSprint(Long id) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        if (sprint.getStatus() != Sprint.SprintStatus.ACTIVE) {
            throw new RuntimeException("Sprint must be ACTIVE to end");
        }

        sprint.setStatus(Sprint.SprintStatus.COMPLETED);
        sprint.setEndedAt(LocalDateTime.now());

        // Calculate completed points and stories, and handle unfinished items
        List<SprintBacklogItem> sprintItems = sprintBacklogItemRepository.findBySprintId(id);
        int committedPoints = 0;
        int completedPoints = 0;
        int storiesCompleted = 0;
        List<Long> unfinishedItemIds = new java.util.ArrayList<>();

        for (SprintBacklogItem sbi : sprintItems) {
            committedPoints += (sbi.getCommittedPoints() != null ? sbi.getCommittedPoints() : 0);

            ProductBacklogItem item = backlogItemRepository.findById(sbi.getBacklogItemId())
                    .orElseThrow(() -> new RuntimeException("Backlog item not found"));

            // Check if item is DONE or ACCEPTED
            if (item.getStatus() == ProductBacklogItem.ItemStatus.DONE ||
                item.getStatus() == ProductBacklogItem.ItemStatus.ACCEPTED) {
                // Item completed - update metrics
                Integer itemPoints = sbi.getActualPoints() != null ? sbi.getActualPoints() : sbi.getCommittedPoints();
                if (itemPoints == null && item.getStoryPoints() != null) {
                    itemPoints = item.getStoryPoints();
                }
                sbi.setActualPoints(itemPoints != null ? itemPoints : 0);
                sbi.setCompletedAt(LocalDateTime.now());
                sprintBacklogItemRepository.save(sbi);

                completedPoints += (sbi.getActualPoints() != null ? sbi.getActualPoints() : 0);
                storiesCompleted++;
            } else {
                // CRITICAL: Item NOT completed - must return to backlog per Scrum rules
                item.setStatus(ProductBacklogItem.ItemStatus.BACKLOG);
                backlogItemRepository.save(item);
                unfinishedItemIds.add(sbi.getBacklogItemId());
            }
        }

        // CRITICAL: Remove unfinished items from sprint_backlog_items (Scrum Reset Phase)
        for (Long backlogItemId : unfinishedItemIds) {
            sprintBacklogItemRepository.deleteBySprintIdAndBacklogItemId(id, backlogItemId);
        }

        sprint = sprintRepository.save(sprint);

        // Publish sprint completed event to Kafka
        SprintEvent event = SprintEvent.builder()
                .sprintId(sprint.getId())
                .projectId(sprint.getProjectId())
                .sprintName(sprint.getName())
                .sprintGoal(sprint.getGoal())
                .status(sprint.getStatus().name())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .committedPoints(committedPoints)
                .completedPoints(completedPoints)
                .velocity(completedPoints) // Velocity is the completed points per sprint
                .storiesCompleted(storiesCompleted)
                .action("COMPLETED")
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishSprintEvent(event);

        // DIRECT CALL: Synchronously notify reporting-service about sprint completion
        // This ensures metrics are saved immediately and we get confirmation
        try {
            // Count remaining backlog items for burndown calculation
            long remainingBacklogCount = backlogItemRepository.countByProjectIdAndStatus(
                sprint.getProjectId(), ProductBacklogItem.ItemStatus.BACKLOG);

            notifyReportingService(sprint.getId(), sprint.getProjectId(), committedPoints, completedPoints,
                storiesCompleted, sprint.getName(), sprint.getEndDate(), (int)remainingBacklogCount);
            System.out.println("✅ Sprint metrics sent to reporting-service: " + completedPoints + " points, " + remainingBacklogCount + " items remaining");
        } catch (Exception e) {
            System.err.println("⚠️ Failed to notify reporting-service, but sprint is completed: " + e.getMessage());
            // Don't fail the sprint completion if reporting fails - it's logged for admin review
        }

        return SprintDto.fromEntity(sprint);
    }

    private void notifyReportingService(Long sprintId, Long projectId, int committedPoints, int completedPoints, int storiesCompleted, String sprintName, java.time.LocalDate endDate, int backlogItemsRemaining) {
        try {
            // Build request body
            String requestBody = String.format(
                "{\"sprintId\":%d,\"projectId\":%d,\"teamId\":1,\"sprintName\":\"%s\",\"endDate\":\"%s\",\"completedPoints\":%d,\"velocity\":%d,\"storiesCompleted\":%d,\"backlogItemsRemaining\":%d}",
                sprintId, projectId, sprintName, endDate.toString(), completedPoints, completedPoints, storiesCompleted, backlogItemsRemaining
            );

            // Send HTTP POST to reporting-service
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(5))
                .build();

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("http://localhost:3001/api/sync/sprint-completion"))
                .header("Content-Type", "application/json")
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(requestBody))
                .timeout(java.time.Duration.ofSeconds(10))
                .build();

            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                System.out.println("✅ Reporting-service acknowledged sprint completion: " + response.body());
            } else {
                System.err.println("⚠️ Reporting-service returned error code " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to call reporting-service: " + e.getMessage(), e);
        }
    }

    @Transactional
    public SprintDto cancelSprint(Long id) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        if (sprint.getStatus() == Sprint.SprintStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed sprint");
        }

        if (sprint.getStatus() == Sprint.SprintStatus.CANCELLED) {
            throw new RuntimeException("Sprint is already cancelled");
        }

        sprint.setStatus(Sprint.SprintStatus.CANCELLED);
        sprint.setEndedAt(LocalDateTime.now());

        // Return all backlog items to BACKLOG status
        List<SprintBacklogItem> sprintItems = sprintBacklogItemRepository.findBySprintId(id);
        for (SprintBacklogItem sbi : sprintItems) {
            backlogItemRepository.findById(sbi.getBacklogItemId()).ifPresent(item -> {
                item.setStatus(ProductBacklogItem.ItemStatus.BACKLOG);
                backlogItemRepository.save(item);
            });
        }

        // Cancel all pending approvals for this sprint (Scrum compliance)
        approvalService.cancelApprovalsForSprint(id);

        sprint = sprintRepository.save(sprint);

        // Publish sprint cancelled event
        SprintEvent event = SprintEvent.builder()
                .sprintId(sprint.getId())
                .projectId(sprint.getProjectId())
                .sprintName(sprint.getName())
                .sprintGoal(sprint.getGoal())
                .status(sprint.getStatus().name())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .action("CANCELLED")
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishSprintEvent(event);

        return SprintDto.fromEntity(sprint);
    }

    /**
     * Add item to sprint - triggers team approval workflow
     * All team members except the requester must approve before item is added to sprint
     */
    @Transactional
    public void addItemToSprint(Long sprintId, Long backlogItemId, List<Long> teamMemberIds, Long requesterId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        // Prevent adding items to active or completed sprints
        if (sprint.getStatus() == Sprint.SprintStatus.ACTIVE) {
            throw new RuntimeException("Cannot add items to an active sprint. Sprint scope is protected.");
        }
        if (sprint.getStatus() == Sprint.SprintStatus.COMPLETED || sprint.getStatus() == Sprint.SprintStatus.CANCELLED) {
            throw new RuntimeException("Cannot add items to a completed or cancelled sprint");
        }

        // Validate backlog item exists
        ProductBacklogItem item = backlogItemRepository.findById(backlogItemId)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        // CRITICAL VALIDATION: Backlog item and sprint must belong to same project
        if (!item.getProjectId().equals(sprint.getProjectId())) {
            throw new RuntimeException("Backlog item and sprint must belong to the same project. " +
                    "Item project: " + item.getProjectId() + ", Sprint project: " + sprint.getProjectId());
        }

        // Check if item already in sprint or pending approval
        boolean alreadyInSprint = sprintBacklogItemRepository
                .findBySprintId(sprintId)
                .stream()
                .anyMatch(sbi -> sbi.getBacklogItemId().equals(backlogItemId));

        if (alreadyInSprint) {
            throw new RuntimeException("Backlog item is already in this sprint");
        }

        if (item.getStatus() == ProductBacklogItem.ItemStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Backlog item is already pending approval for a sprint");
        }

        // Trigger approval workflow
        // Product Owner approval required when Developer creates/moves item
        approvalService.requestApprovals(backlogItemId, sprintId, teamMemberIds, requesterId, "DEVELOPER");

        System.out.println("Approval workflow initiated for item " + backlogItemId + " in sprint " + sprintId +
                ". Waiting for Product Owner approval.");
    }

    @Transactional
    public void removeItemFromSprint(Long sprintId, Long backlogItemId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        // Prevent removing items from active or completed sprints
        if (sprint.getStatus() == Sprint.SprintStatus.ACTIVE) {
            throw new RuntimeException("Cannot remove items from an active sprint. Sprint scope is protected.");
        }
        if (sprint.getStatus() == Sprint.SprintStatus.COMPLETED || sprint.getStatus() == Sprint.SprintStatus.CANCELLED) {
            throw new RuntimeException("Cannot remove items from a completed or cancelled sprint");
        }

        sprintBacklogItemRepository.deleteBySprintIdAndBacklogItemId(sprintId, backlogItemId);

        // Update item status back to BACKLOG
        backlogItemRepository.findById(backlogItemId).ifPresent(item -> {
            item.setStatus(ProductBacklogItem.ItemStatus.BACKLOG);
            backlogItemRepository.save(item);
        });
    }

    public List<ProductBacklogItem> getSprintBacklog(Long sprintId) {
        List<SprintBacklogItem> sprintItems = sprintBacklogItemRepository.findBySprintId(sprintId);
        return sprintItems.stream()
                .map(sbi -> backlogItemRepository.findById(sbi.getBacklogItemId())
                        .orElseThrow(() -> new RuntimeException("Backlog item not found")))
                .collect(Collectors.toList());
    }

    public com.example.scrumcoreservice.dto.SprintBoardDto getSprintBoard(Long sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        List<ProductBacklogItem> allItems = getSprintBacklog(sprintId);

        // Group items by board column
        List<com.example.scrumcoreservice.dto.BacklogItemDto> toDo = new java.util.ArrayList<>();
        List<com.example.scrumcoreservice.dto.BacklogItemDto> inProgress = new java.util.ArrayList<>();
        List<com.example.scrumcoreservice.dto.BacklogItemDto> review = new java.util.ArrayList<>();
        List<com.example.scrumcoreservice.dto.BacklogItemDto> done = new java.util.ArrayList<>();

        for (ProductBacklogItem item : allItems) {
            com.example.scrumcoreservice.dto.BacklogItemDto dto = com.example.scrumcoreservice.dto.BacklogItemDto.fromEntity(item);

            if (item.getBoardColumn() == null) {
                // Default to TO_DO if not set
                toDo.add(dto);
            } else {
                switch (item.getBoardColumn()) {
                    case TO_DO -> toDo.add(dto);
                    case IN_PROGRESS -> inProgress.add(dto);
                    case REVIEW -> review.add(dto);
                    case DONE -> done.add(dto);
                }
            }
        }

        com.example.scrumcoreservice.dto.SprintBoardDto.BoardColumnsDto columns =
                com.example.scrumcoreservice.dto.SprintBoardDto.BoardColumnsDto.builder()
                        .toDo(toDo)
                        .inProgress(inProgress)
                        .review(review)
                        .done(done)
                        .build();

        return com.example.scrumcoreservice.dto.SprintBoardDto.builder()
                .sprintId(sprint.getId())
                .sprintName(sprint.getName())
                .sprintStatus(sprint.getStatus().name())
                .columns(columns)
                .build();
    }

    @Transactional
    public void moveBoardItem(Long sprintId, Long backlogItemId, ProductBacklogItem.BoardColumn targetColumn) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        // Can only move items in ACTIVE sprints
        if (sprint.getStatus() != Sprint.SprintStatus.ACTIVE) {
            throw new RuntimeException("Can only move items on board in ACTIVE sprints");
        }

        ProductBacklogItem item = backlogItemRepository.findById(backlogItemId)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        // Verify item is in this sprint
        boolean itemInSprint = sprintBacklogItemRepository.findBySprintId(sprintId)
                .stream()
                .anyMatch(sbi -> sbi.getBacklogItemId().equals(backlogItemId));

        if (!itemInSprint) {
            throw new RuntimeException("Backlog item is not in this sprint");
        }

        // Update board column - items can move in ANY order per Scrum requirement
        item.setBoardColumn(targetColumn);



        // If moved to DONE, update status to DONE for PO review
        if (targetColumn == ProductBacklogItem.BoardColumn.DONE) {
            item.setStatus(ProductBacklogItem.ItemStatus.DONE);
        }



        backlogItemRepository.save(item);
    }
}
