package com.example.scrumcoreservice.service;

import com.example.scrumcoreservice.dto.TaskDto;
import com.example.scrumcoreservice.entity.ProductBacklogItem;
import com.example.scrumcoreservice.entity.Task;
import com.example.scrumcoreservice.events.TaskEvent;
import com.example.scrumcoreservice.repository.ProductBacklogItemRepository;
import com.example.scrumcoreservice.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
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

        // Publish task created event
        TaskEvent event = TaskEvent.builder()
                .taskId(task.getId())
                .backlogItemId(backlogItemId)
                .sprintId(backlogItem.getSprintId())
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

        task.setStatus(newStatus);

        if (newStatus == Task.TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        }

        task = taskRepository.save(task);

        // Publish task status changed event
        TaskEvent event = TaskEvent.builder()
                .taskId(task.getId())
                .backlogItemId(task.getBacklogItem().getId())
                .sprintId(task.getBacklogItem().getSprintId())
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

        task.setAssigneeId(assigneeId);
        task = taskRepository.save(task);

        // Publish task assigned event
        TaskEvent event = TaskEvent.builder()
                .taskId(task.getId())
                .backlogItemId(task.getBacklogItem().getId())
                .sprintId(task.getBacklogItem().getSprintId())
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
    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }
}
