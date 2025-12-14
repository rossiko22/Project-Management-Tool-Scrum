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

        sprint.setStatus(Sprint.SprintStatus.ACTIVE);
        sprint.setStartedAt(LocalDateTime.now());

        // Update all backlog items in this sprint to IN_SPRINT status
        List<SprintBacklogItem> sprintItems = sprintBacklogItemRepository.findBySprintId(id);
        int committedPoints = 0;
        for (SprintBacklogItem sbi : sprintItems) {
            backlogItemRepository.findById(sbi.getBacklogItemId()).ifPresent(item -> {
                item.setStatus(ProductBacklogItem.ItemStatus.IN_SPRINT);
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

        // Calculate completed points and stories
        List<SprintBacklogItem> sprintItems = sprintBacklogItemRepository.findBySprintId(id);
        int completedPoints = 0;
        int storiesCompleted = 0;
        for (SprintBacklogItem sbi : sprintItems) {
            backlogItemRepository.findById(sbi.getBacklogItemId()).ifPresent(item -> {
                if (item.getStatus() == ProductBacklogItem.ItemStatus.DONE) {
                    // Item is done, count points
                }
            });
        }

        sprint = sprintRepository.save(sprint);

        // Publish sprint completed event
        SprintEvent event = SprintEvent.builder()
                .sprintId(sprint.getId())
                .projectId(sprint.getProjectId())
                .sprintName(sprint.getName())
                .sprintGoal(sprint.getGoal())
                .status(sprint.getStatus().name())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .completedPoints(completedPoints)
                .velocity(completedPoints)
                .storiesCompleted(storiesCompleted)
                .action("COMPLETED")
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishSprintEvent(event);

        return SprintDto.fromEntity(sprint);
    }

    @Transactional
    public void addItemToSprint(Long sprintId, Long backlogItemId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        // Prevent adding items to active or completed sprints
        if (sprint.getStatus() == Sprint.SprintStatus.ACTIVE) {
            throw new RuntimeException("Cannot add items to an active sprint. Sprint scope is protected.");
        }
        if (sprint.getStatus() == Sprint.SprintStatus.COMPLETED || sprint.getStatus() == Sprint.SprintStatus.CANCELLED) {
            throw new RuntimeException("Cannot add items to a completed or cancelled sprint");
        }

        ProductBacklogItem item = backlogItemRepository.findById(backlogItemId)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        SprintBacklogItem sprintBacklogItem = SprintBacklogItem.builder()
                .sprintId(sprintId)
                .backlogItemId(backlogItemId)
                .committedPoints(item.getStoryPoints())
                .build();

        sprintBacklogItemRepository.save(sprintBacklogItem);

        // Update item status
        item.setStatus(ProductBacklogItem.ItemStatus.SPRINT_READY);
        backlogItemRepository.save(item);
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
}
