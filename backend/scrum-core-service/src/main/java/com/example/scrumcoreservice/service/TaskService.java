package com.example.scrumcoreservice.service;

import com.example.scrumcoreservice.dto.TaskDto;
import com.example.scrumcoreservice.entity.ProductBacklogItem;
import com.example.scrumcoreservice.entity.Task;
import com.example.scrumcoreservice.events.TaskEvent;
import com.example.scrumcoreservice.repository.ProductBacklogItemRepository;
import com.example.scrumcoreservice.repository.SprintBacklogItemRepository;
import com.example.scrumcoreservice.repository.TaskRepository;
import com.example.scrumcoreservice.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProductBacklogItemRepository backlogItemRepository;
    private final SprintBacklogItemRepository sprintBacklogItemRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public TaskDto createTask(Long backlogItemId, String title, String description) {
        ProductBacklogItem backlogItem = backlogItemRepository.findById(backlogItemId)
                .orElseThrow(() -> new RuntimeException("Backlog item not found"));

        Task task = Task.builder()
                .backlogItem(backlogItem)
                .title(title)
                .description(description)
                .status(Task.TaskStatus.TO_DO)
                .build();

        task = taskRepository.save(task);

        // Get sprint ID from sprint_backlog_items table
        Long sprintId = sprintBacklogItemRepository.findSprintIdByBacklogItemId(backlogItemId).orElse(null);

        // Publish task created event
        TaskEvent event = TaskEvent.builder()
                .taskId(task.getId())
                .backlogItemId(backlogItemId)
                .sprintId(sprintId)
                .projectId(backlogItem.getProjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .action("CREATED")
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishTaskEvent(event);

        return TaskDto.fromEntity(task);
    }

    public List<TaskDto> getTasksByBacklogItem(Long backlogItemId) {
        return taskRepository.findByBacklogItemId(backlogItemId)
                .stream()
                .map(TaskDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<TaskDto> getTasksBySprint(Long sprintId) {
        return taskRepository.findBySprintId(sprintId)
                .stream()
                .map(TaskDto::fromEntity)
                .collect(Collectors.toList());
    }

    public TaskDto getTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        return TaskDto.fromEntity(task);
    }

    @Transactional
    public TaskDto updateTaskStatus(Long id, Task.TaskStatus newStatus) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        UserPrincipal principal = getCurrentUser();

        // Developers can only update their own assigned tasks
        if (!isOrgAdmin(principal) && !principal.getUserId().equals(task.getAssigneeId())) {
            throw new AccessDeniedException("You can only update status of tasks assigned to you");
        }

        task.setStatus(newStatus);

        if (newStatus == Task.TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        }

        task = taskRepository.save(task);

        // Get sprint ID from sprint_backlog_items table
        Long sprintId = sprintBacklogItemRepository.findSprintIdByBacklogItemId(task.getBacklogItem().getId()).orElse(null);

        // Publish task status changed event
        TaskEvent event = TaskEvent.builder()
                .taskId(task.getId())
                .backlogItemId(task.getBacklogItem().getId())
                .sprintId(sprintId)
                .projectId(task.getBacklogItem().getProjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .assigneeId(task.getAssigneeId())
                .estimatedHours(task.getEstimatedHours())
                .actualHours(task.getActualHours())
                .action("STATUS_CHANGED")
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishTaskEvent(event);

        return TaskDto.fromEntity(task);
    }

    @Transactional
    public TaskDto assignTask(Long id, Long assigneeId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        UserPrincipal principal = getCurrentUser();

        // Developers can only assign tasks to themselves (self-assignment)
        if (!isOrgAdmin(principal) && !principal.getUserId().equals(assigneeId)) {
            throw new AccessDeniedException("You can only assign tasks to yourself");
        }

        task.setAssigneeId(assigneeId);
        task = taskRepository.save(task);

        // Get sprint ID from sprint_backlog_items table
        Long sprintId = sprintBacklogItemRepository.findSprintIdByBacklogItemId(task.getBacklogItem().getId()).orElse(null);

        // Publish task assigned event
        TaskEvent event = TaskEvent.builder()
                .taskId(task.getId())
                .backlogItemId(task.getBacklogItem().getId())
                .sprintId(sprintId)
                .projectId(task.getBacklogItem().getProjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .assigneeId(assigneeId)
                .action("ASSIGNED")
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishTaskEvent(event);

        return TaskDto.fromEntity(task);
    }

    @Transactional
    public TaskDto unassignTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        UserPrincipal principal = getCurrentUser();

        // Developers can only unassign their own tasks
        if (!isOrgAdmin(principal) && !principal.getUserId().equals(task.getAssigneeId())) {
            throw new AccessDeniedException("You can only unassign your own tasks");
        }

        task.setAssigneeId(null);
        task = taskRepository.save(task);

        // Get sprint ID from sprint_backlog_items table
        Long sprintId = sprintBacklogItemRepository.findSprintIdByBacklogItemId(task.getBacklogItem().getId()).orElse(null);

        // Publish task unassigned event
        TaskEvent event = TaskEvent.builder()
                .taskId(task.getId())
                .backlogItemId(task.getBacklogItem().getId())
                .sprintId(sprintId)
                .projectId(task.getBacklogItem().getProjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .action("UNASSIGNED")
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishTaskEvent(event);

        return TaskDto.fromEntity(task);
    }

    @Transactional
    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        UserPrincipal principal = getCurrentUser();

        // Developers can only delete their own tasks (created by or assigned to them)
        if (!isOrgAdmin(principal) && !principal.getUserId().equals(task.getAssigneeId())) {
            throw new AccessDeniedException("You can only delete tasks assigned to you");
        }

        taskRepository.deleteById(id);
    }

    private UserPrincipal getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserPrincipal) {
            return (UserPrincipal) principal;
        }
        throw new RuntimeException("Unable to get current user");
    }

    private boolean isOrgAdmin(UserPrincipal principal) {
        return principal.getRoles().contains("ORGANIZATION_ADMIN");
    }
}
