package com.example.scrumcoreservice.service;

import com.example.scrumcoreservice.dto.BacklogItemDto;
import com.example.scrumcoreservice.dto.CreateBacklogItemRequest;
import com.example.scrumcoreservice.entity.ProductBacklogItem;
import com.example.scrumcoreservice.events.BacklogItemEvent;
import com.example.scrumcoreservice.repository.ProductBacklogItemRepository;
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
    private final JwtUtil jwtUtil;
    private final EventPublisher eventPublisher;

    @Transactional
    public BacklogItemDto createBacklogItem(CreateBacklogItemRequest request, Long userId, String userRole) {
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
                .status(ProductBacklogItem.ItemStatus.BACKLOG)
                .acceptanceCriteria(request.getAcceptanceCriteria())
                .createdBy(userId)
                .createdByRole(userRole)
                .build();

        item = backlogItemRepository.save(item);

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
    public BacklogItemDto updateBacklogItem(Long id, CreateBacklogItemRequest request) {
        ProductBacklogItem item = backlogItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        boolean storyPointsChanged = item.getStoryPoints() != null &&
                                     !item.getStoryPoints().equals(request.getStoryPoints());

        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setType(ProductBacklogItem.ItemType.valueOf(request.getType()));
        item.setStoryPoints(request.getStoryPoints());
        item.setPriority(request.getPriority());
        item.setAcceptanceCriteria(request.getAcceptanceCriteria());

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
