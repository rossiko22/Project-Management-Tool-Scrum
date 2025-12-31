package com.example.scrumcoreservice.controller;

import com.example.scrumcoreservice.dto.CreateSprintRequest;
import com.example.scrumcoreservice.dto.SprintDto;
import com.example.scrumcoreservice.security.UserPrincipal;
import com.example.scrumcoreservice.service.SprintService;
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
@RequestMapping("/sprints")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Sprint Management", description = "Sprint lifecycle and management endpoints")
public class SprintController {

    private final SprintService sprintService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Create sprint", description = "Create a new sprint (Scrum Master only)")
    public ResponseEntity<SprintDto> createSprint(
            @Valid @RequestBody CreateSprintRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        SprintDto sprint = sprintService.createSprint(request, principal.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(sprint);
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get project sprints", description = "Get all sprints for a project")
    public ResponseEntity<List<SprintDto>> getProjectSprints(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {

        // Validate project access
        boolean hasAccess = principal.getRoles().contains("ORGANIZATION_ADMIN") ||
            principal.getProjectIds().stream().anyMatch(id -> id.longValue() == projectId);
        if (!hasAccess) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(sprintService.getProjectSprints(projectId));
    }

    @GetMapping("/project/{projectId}/active")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get active sprint", description = "Get the active sprint for a project")
    public ResponseEntity<SprintDto> getActiveSprint(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {

        // Validate project access
        boolean hasAccess = principal.getRoles().contains("ORGANIZATION_ADMIN") ||
            principal.getProjectIds().stream().anyMatch(id -> id.longValue() == projectId);
        if (!hasAccess) {
            return ResponseEntity.status(403).build();
        }

        SprintDto activeSprint = sprintService.getActiveSprint(projectId);
        if (activeSprint == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(activeSprint);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get sprint", description = "Get sprint details by ID")
    public ResponseEntity<SprintDto> getSprint(@PathVariable Long id) {
        return ResponseEntity.ok(sprintService.getSprint(id));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Start sprint", description = "Start a sprint (SM only)")
    public ResponseEntity<SprintDto> startSprint(@PathVariable Long id) {
        return ResponseEntity.ok(sprintService.startSprint(id));
    }

    @PostMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "End sprint", description = "End a sprint (SM only)")
    public ResponseEntity<SprintDto> endSprint(@PathVariable Long id) {
        return ResponseEntity.ok(sprintService.endSprint(id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Cancel sprint", description = "Cancel a sprint (SM only)")
    public ResponseEntity<SprintDto> cancelSprint(@PathVariable Long id) {
        return ResponseEntity.ok(sprintService.cancelSprint(id));
    }

    @PostMapping("/{sprintId}/items")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Request to add item to sprint",
               description = "Team member requests to add backlog item to sprint - triggers team approval workflow (all members except requester must approve)")
    public ResponseEntity<Void> addItemToSprint(
            @PathVariable Long sprintId,
            @Valid @RequestBody com.example.scrumcoreservice.dto.AddItemToSprintRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        sprintService.addItemToSprint(sprintId, request.getBacklogItemId(),
                request.getAssignedDeveloperIds(), principal.getUserId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{sprintId}/items/{backlogItemId}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Remove item from sprint",
               description = "Product Owner removes backlog item from sprint (before sprint starts - enforces Scrum methodology)")
    public ResponseEntity<Void> removeItemFromSprint(
            @PathVariable Long sprintId,
            @PathVariable Long backlogItemId) {
        sprintService.removeItemFromSprint(sprintId, backlogItemId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{sprintId}/backlog")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get sprint backlog", description = "Get all backlog items in a sprint")
    public ResponseEntity<List<?>> getSprintBacklog(@PathVariable Long sprintId) {
        return ResponseEntity.ok(sprintService.getSprintBacklog(sprintId));
    }

    @GetMapping("/{sprintId}/board")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get sprint board",
               description = "Get sprint board view with backlog items grouped by board column (TO_DO, IN_PROGRESS, REVIEW, DONE)")
    public ResponseEntity<com.example.scrumcoreservice.dto.SprintBoardDto> getSprintBoard(@PathVariable Long sprintId) {
        return ResponseEntity.ok(sprintService.getSprintBoard(sprintId));
    }

    @PostMapping("/{sprintId}/board/move")
    @PreAuthorize("hasAnyRole('DEVELOPER', 'SCRUM_MASTER', 'PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Move item on sprint board",
               description = "Move a backlog item between board columns (TO_DO → IN_PROGRESS → REVIEW → DONE). Can move in any order.")
    public ResponseEntity<Void> moveBoardItem(
            @PathVariable Long sprintId,
            @Valid @RequestBody com.example.scrumcoreservice.dto.MoveBoardItemRequest request) {

        com.example.scrumcoreservice.entity.ProductBacklogItem.BoardColumn targetColumn;
        try {
            targetColumn = com.example.scrumcoreservice.entity.ProductBacklogItem.BoardColumn.valueOf(request.getTargetColumn());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        sprintService.moveBoardItem(sprintId, request.getBacklogItemId(), targetColumn);
        return ResponseEntity.ok().build();
    }
}
