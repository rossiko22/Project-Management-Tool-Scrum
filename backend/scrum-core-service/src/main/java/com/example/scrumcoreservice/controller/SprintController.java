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
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Create sprint", description = "Create a new sprint (SM or PO)")
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

    @PostMapping("/{sprintId}/items/{backlogItemId}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Add item to sprint", description = "Add backlog item to sprint (during planning)")
    public ResponseEntity<Void> addItemToSprint(
            @PathVariable Long sprintId,
            @PathVariable Long backlogItemId) {
        sprintService.addItemToSprint(sprintId, backlogItemId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{sprintId}/items/{backlogItemId}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Remove item from sprint", description = "Remove backlog item from sprint (before sprint starts)")
    public ResponseEntity<Void> removeItemFromSprint(
            @PathVariable Long sprintId,
            @PathVariable Long backlogItemId) {
        sprintService.removeItemFromSprint(sprintId, backlogItemId);
        return ResponseEntity.noContent().build();
    }
}
