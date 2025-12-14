package com.example.scrumcoreservice.controller;

import com.example.scrumcoreservice.dto.BacklogItemDto;
import com.example.scrumcoreservice.dto.CreateBacklogItemRequest;
import com.example.scrumcoreservice.security.UserPrincipal;
import com.example.scrumcoreservice.service.BacklogService;
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

/**
 * RESTful controller for project-scoped backlog operations.
 * Handles endpoints under /projects/{projectId}/backlog
 */
@RestController
@RequestMapping("/projects/{projectId}")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Project Backlog Management", description = "Project-scoped backlog endpoints")
public class ProjectBacklogController {

    private final BacklogService backlogService;

    @GetMapping("/backlog")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get project backlog", description = "Get all backlog items for a project, ordered by priority")
    public ResponseEntity<List<BacklogItemDto>> getProjectBacklog(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {

        // Validate project access
        boolean hasAccess = principal.getRoles().contains("ORGANIZATION_ADMIN") ||
            principal.getProjectIds().stream().anyMatch(id -> id.longValue() == projectId);
        if (!hasAccess) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(backlogService.getProjectBacklog(projectId));
    }

    @PostMapping("/backlog-items")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Create backlog item", description = "Create a new backlog item for a project")
    public ResponseEntity<BacklogItemDto> createBacklogItem(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateBacklogItemRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        // Validate project access
        boolean hasAccess =
                principal.getRoles().contains("ORGANIZATION_ADMIN") ||
                principal.getProjectIds().contains(projectId);

        if (!hasAccess) {
            return ResponseEntity.status(403).build();
        }

        // Ensure projectId in path matches projectId in request body
        if (request.getProjectId() == null) {
            request.setProjectId(projectId);
        } else if (!request.getProjectId().equals(projectId)) {
            return ResponseEntity.badRequest().build();
        }

        // Determine user's primary Scrum role
        String userRole = principal.getRoles().contains("PRODUCT_OWNER") ? "PRODUCT_OWNER" : "DEVELOPER";

        BacklogItemDto item = backlogService.createBacklogItem(request, principal.getUserId(), userRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }
}
