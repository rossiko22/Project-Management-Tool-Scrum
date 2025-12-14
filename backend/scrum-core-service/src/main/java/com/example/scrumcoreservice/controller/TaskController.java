package com.example.scrumcoreservice.controller;

import com.example.scrumcoreservice.dto.TaskDto;
import com.example.scrumcoreservice.entity.Task;
import com.example.scrumcoreservice.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Task Management", description = "Task tracking and management endpoints")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @PreAuthorize("hasAnyRole('DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Create task", description = "Create a new task for a backlog item (Developers only)")
    public ResponseEntity<TaskDto> createTask(@RequestBody CreateTaskRequest request) {
        TaskDto task = taskService.createTask(
                request.getBacklogItemId(),
                request.getTitle(),
                request.getDescription()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(task);
    }

    @GetMapping("/backlog-item/{backlogItemId}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get tasks by backlog item", description = "Get all tasks for a backlog item")
    public ResponseEntity<List<TaskDto>> getTasksByBacklogItem(@PathVariable Long backlogItemId) {
        return ResponseEntity.ok(taskService.getTasksByBacklogItem(backlogItemId));
    }

    @GetMapping("/sprint/{sprintId}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get tasks by sprint", description = "Get all tasks in a sprint (for sprint board)")
    public ResponseEntity<List<TaskDto>> getTasksBySprint(@PathVariable Long sprintId) {
        return ResponseEntity.ok(taskService.getTasksBySprint(sprintId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get task", description = "Get task details by ID")
    public ResponseEntity<TaskDto> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTask(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Update task status", description = "Update task status - developers can only update their assigned tasks")
    public ResponseEntity<TaskDto> updateTaskStatus(
            @PathVariable Long id,
            @RequestParam Task.TaskStatus status) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, status));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Self-assign task", description = "Developers can only assign tasks to themselves (pull model)")
    public ResponseEntity<TaskDto> assignTask(
            @PathVariable Long id,
            @RequestParam Long assigneeId) {
        return ResponseEntity.ok(taskService.assignTask(id, assigneeId));
    }

    @PatchMapping("/{id}/unassign")
    @PreAuthorize("hasAnyRole('DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Unassign task", description = "Developers can unassign their own tasks")
    public ResponseEntity<TaskDto> unassignTask(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.unassignTask(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Delete task", description = "Delete a task (developers can only delete their own tasks)")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class CreateTaskRequest {
        private Long backlogItemId;
        private String title;
        private String description;
    }
}
