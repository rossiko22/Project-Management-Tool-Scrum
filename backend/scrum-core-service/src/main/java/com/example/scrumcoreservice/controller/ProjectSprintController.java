package com.example.scrumcoreservice.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.example.scrumcoreservice.dto.CreateSprintRequest;
import com.example.scrumcoreservice.dto.SprintDto;
import com.example.scrumcoreservice.security.UserPrincipal;
import com.example.scrumcoreservice.service.SprintService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/projects/{projectId}/sprints")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Project Sprint Management", description = "Project-scoped sprint endpoints")
public class ProjectSprintController {

    private final SprintService sprintService;

    /* ---------------------------------------------------
     * Helper: project access check (SAFE)
     * --------------------------------------------------- */
    private boolean hasProjectAccess(UserPrincipal principal, Long projectId) {
        if (principal.getRoles().contains("ORGANIZATION_ADMIN")) {
            return true;
        }

        return principal.getProjectIds().stream()
                .map(id -> ((Number) id).longValue())   // 🔑 normalize JWT numbers
                .anyMatch(id -> id.equals(projectId));
    }

    /* ---------------------------------------------------
     * Get all sprints
     * --------------------------------------------------- */
    @GetMapping
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get all project sprints")
    public ResponseEntity<List<SprintDto>> getProjectSprints(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (!hasProjectAccess(principal, projectId)) {
            System.out.println("getProjectSprints → 403");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(sprintService.getProjectSprints(projectId));
    }

    /* ---------------------------------------------------
     * Get active sprint
     * --------------------------------------------------- */
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get active sprint")
    public ResponseEntity<SprintDto> getActiveSprint(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {

        System.out.println("=== ACTIVE SPRINT ACCESS CHECK ===");
        System.out.println("Requested Project ID: " + projectId);
        System.out.println("User Project IDs: " + principal.getProjectIds());
        System.out.println("User Roles: " + principal.getRoles());

        if (!hasProjectAccess(principal, projectId)) {
            System.out.println("getActiveSprint → 403");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        SprintDto activeSprint = sprintService.getActiveSprint(projectId);
        return activeSprint == null
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(activeSprint);
    }

    /* ---------------------------------------------------
     * Create sprint
     * --------------------------------------------------- */
    @PostMapping
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Create sprint")
    public ResponseEntity<SprintDto> createSprint(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateSprintRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (!hasProjectAccess(principal, projectId)) {
            System.out.println("createSprint → 403");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (request.getProjectId() == null) {
            request.setProjectId(projectId);
        } else if (!request.getProjectId().equals(projectId)) {
            return ResponseEntity.badRequest().build();
        }

        SprintDto sprint = sprintService.createSprint(request, principal.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(sprint);
    }
}
