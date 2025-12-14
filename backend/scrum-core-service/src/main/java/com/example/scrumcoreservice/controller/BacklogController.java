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

@RestController
@RequestMapping("/backlog")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Product Backlog", description = "Product backlog management endpoints")
public class BacklogController {

    private final BacklogService backlogService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Create backlog item", description = "Create a new backlog item (PO creates stories/epics, Developers create bugs/tech tasks)")
    public ResponseEntity<BacklogItemDto> createBacklogItem(
            @Valid @RequestBody CreateBacklogItemRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        // Determine user's primary Scrum role (simplified)
        String userRole = principal.getRoles().contains("PRODUCT_OWNER") ? "PRODUCT_OWNER" : "DEVELOPER";

        BacklogItemDto item = backlogService.createBacklogItem(request, principal.getUserId(), userRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    @GetMapping("/project/{projectId}")
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

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get backlog item", description = "Get backlog item details by ID")
    public ResponseEntity<BacklogItemDto> getBacklogItem(@PathVariable Long id) {
        return ResponseEntity.ok(backlogService.getBacklogItem(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Update backlog item", description = "Update backlog item (PO only)")
    public ResponseEntity<BacklogItemDto> updateBacklogItem(
            @PathVariable Long id,
            @Valid @RequestBody CreateBacklogItemRequest request) {
        return ResponseEntity.ok(backlogService.updateBacklogItem(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Delete backlog item", description = "Delete backlog item (PO only)")
    public ResponseEntity<Void> deleteBacklogItem(@PathVariable Long id) {
        backlogService.deleteBacklogItem(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/project/{projectId}/reorder")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Reorder backlog", description = "Reorder backlog items (PO only)")
    public ResponseEntity<Void> reorderBacklog(
            @PathVariable Long projectId,
            @RequestBody List<Long> orderedIds,
            @AuthenticationPrincipal UserPrincipal principal) {

        // Validate project access
        boolean hasAccess = principal.getRoles().contains("ORGANIZATION_ADMIN") ||
            principal.getProjectIds().stream().anyMatch(id -> id.longValue() == projectId);
        if (!hasAccess) {
            return ResponseEntity.status(403).build();
        }

        backlogService.reorderBacklog(projectId, orderedIds);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Accept backlog item", description = "Product Owner accepts completed backlog item against acceptance criteria")
    public ResponseEntity<BacklogItemDto> acceptBacklogItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(backlogService.acceptBacklogItem(id, principal.getUserId()));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Reject backlog item", description = "Product Owner rejects completed backlog item with reason")
    public ResponseEntity<BacklogItemDto> rejectBacklogItem(
            @PathVariable Long id,
            @RequestParam String reason,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(backlogService.rejectBacklogItem(id, principal.getUserId(), reason));
    }
}
