package com.example.scrumcoreservice.controller;

import com.example.scrumcoreservice.dto.BacklogItemDto;
import com.example.scrumcoreservice.dto.CreateBacklogItemRequest;
import com.example.scrumcoreservice.security.UserPrincipal;
import com.example.scrumcoreservice.service.BacklogService;
import com.example.scrumcoreservice.service.RabbitMQLoggerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
    private final RabbitMQLoggerService logger;

    @PostMapping
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Create backlog item",
               description = "Create a new backlog item (Product Owner only - enforces Scrum methodology)")
    public ResponseEntity<BacklogItemDto> createBacklogItem(
            @Valid @RequestBody CreateBacklogItemRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {

        String url = httpRequest.getRequestURI();
        logger.logInfo("Creating backlog item: " + request.getTitle() + " for project: " + request.getProjectId(), url);

        try {
            // User must be Product Owner per Scrum methodology
            String userRole = "PRODUCT_OWNER";

            BacklogItemDto item = backlogService.createBacklogItem(request, principal.getUserId(), userRole);
            logger.logInfo("Backlog item created successfully. ID: " + item.getId(), url);
            return ResponseEntity.status(HttpStatus.CREATED).body(item);
        } catch (Exception e) {
            logger.logError("Failed to create backlog item: " + e.getMessage(), url);
            throw e;
        }
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get project backlog", description = "Get all backlog items for a project, ordered by priority")
    public ResponseEntity<List<BacklogItemDto>> getProjectBacklog(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {

        String url = httpRequest.getRequestURI();
        logger.logInfo("Getting backlog for project: " + projectId + " by user: " + principal.getUsername(), url);

        // Validate project access
        boolean hasAccess = principal.getRoles().contains("ORGANIZATION_ADMIN") ||
            principal.getProjectIds().stream().anyMatch(id -> id.longValue() == projectId);
        if (!hasAccess) {
            logger.logWarn("Access denied to project " + projectId + " for user: " + principal.getUsername(), url);
            return ResponseEntity.status(403).build();
        }

        List<BacklogItemDto> items = backlogService.getProjectBacklog(projectId);
        logger.logInfo("Retrieved " + items.size() + " backlog items for project: " + projectId, url);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get backlog item", description = "Get backlog item details by ID")
    public ResponseEntity<BacklogItemDto> getBacklogItem(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        String url = httpRequest.getRequestURI();
        logger.logInfo("Getting backlog item: " + id, url);
        BacklogItemDto item = backlogService.getBacklogItem(id);
        logger.logInfo("Retrieved backlog item: " + item.getTitle(), url);
        return ResponseEntity.ok(item);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Update backlog item", description = "Update backlog item (PO only)")
    public ResponseEntity<BacklogItemDto> updateBacklogItem(
            @PathVariable Long id,
            @Valid @RequestBody CreateBacklogItemRequest request,
            HttpServletRequest httpRequest) {
        String url = httpRequest.getRequestURI();
        logger.logInfo("Updating backlog item: " + id, url);
        try {
            BacklogItemDto item = backlogService.updateBacklogItem(id, request);
            logger.logInfo("Backlog item updated successfully: " + id, url);
            return ResponseEntity.ok(item);
        } catch (Exception e) {
            logger.logError("Failed to update backlog item " + id + ": " + e.getMessage(), url);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Delete backlog item", description = "Delete backlog item (PO only)")
    public ResponseEntity<Void> deleteBacklogItem(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        String url = httpRequest.getRequestURI();
        logger.logInfo("Deleting backlog item: " + id, url);
        try {
            backlogService.deleteBacklogItem(id);
            logger.logInfo("Backlog item deleted successfully: " + id, url);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.logError("Failed to delete backlog item " + id + ": " + e.getMessage(), url);
            throw e;
        }
    }

    @PostMapping("/project/{projectId}/reorder")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Reorder backlog", description = "Reorder backlog items (PO only)")
    public ResponseEntity<Void> reorderBacklog(
            @PathVariable Long projectId,
            @RequestBody List<Long> orderedIds,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {

        String url = httpRequest.getRequestURI();
        logger.logInfo("Reordering backlog for project: " + projectId + " (" + orderedIds.size() + " items)", url);

        // Validate project access
        boolean hasAccess = principal.getRoles().contains("ORGANIZATION_ADMIN") ||
            principal.getProjectIds().stream().anyMatch(id -> id.longValue() == projectId);
        if (!hasAccess) {
            logger.logWarn("Access denied to reorder backlog for project " + projectId, url);
            return ResponseEntity.status(403).build();
        }

        backlogService.reorderBacklog(projectId, orderedIds);
        logger.logInfo("Backlog reordered successfully for project: " + projectId, url);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Accept backlog item", description = "Product Owner accepts completed backlog item against acceptance criteria")
    public ResponseEntity<BacklogItemDto> acceptBacklogItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        String url = httpRequest.getRequestURI();
        logger.logInfo("Product Owner accepting backlog item: " + id, url);
        BacklogItemDto item = backlogService.acceptBacklogItem(id, principal.getUserId());
        logger.logInfo("Backlog item accepted: " + id, url);
        return ResponseEntity.ok(item);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Reject backlog item", description = "Product Owner rejects completed backlog item with reason")
    public ResponseEntity<BacklogItemDto> rejectBacklogItem(
            @PathVariable Long id,
            @RequestParam String reason,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        String url = httpRequest.getRequestURI();
        logger.logInfo("Product Owner rejecting backlog item: " + id + " with reason: " + reason, url);
        BacklogItemDto item = backlogService.rejectBacklogItem(id, principal.getUserId(), reason);
        logger.logInfo("Backlog item rejected: " + id, url);
        return ResponseEntity.ok(item);
    }
}
