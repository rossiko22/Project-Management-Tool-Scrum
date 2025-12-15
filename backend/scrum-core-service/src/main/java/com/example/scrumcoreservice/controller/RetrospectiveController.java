package com.example.scrumcoreservice.controller;

import com.example.scrumcoreservice.dto.CreateRetrospectiveRequest;
import com.example.scrumcoreservice.dto.RetrospectiveDto;
import com.example.scrumcoreservice.security.UserPrincipal;
import com.example.scrumcoreservice.service.RetrospectiveService;
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

@RestController
@RequestMapping("/retrospectives")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Sprint Retrospectives", description = "Sprint retrospective management endpoints")
public class RetrospectiveController {

    private final RetrospectiveService retrospectiveService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Create retrospective", description = "Create a sprint retrospective (Scrum Master only)")
    public ResponseEntity<RetrospectiveDto> createRetrospective(
            @Valid @RequestBody CreateRetrospectiveRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        RetrospectiveDto retrospective = retrospectiveService.createRetrospective(request, principal.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(retrospective);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Update retrospective", description = "Update a sprint retrospective (Scrum Master only)")
    public ResponseEntity<RetrospectiveDto> updateRetrospective(
            @PathVariable Long id,
            @Valid @RequestBody CreateRetrospectiveRequest request) {

        return ResponseEntity.ok(retrospectiveService.updateRetrospective(id, request));
    }

    @GetMapping("/sprint/{sprintId}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get retrospective by sprint", description = "Get retrospective for a specific sprint")
    public ResponseEntity<RetrospectiveDto> getRetrospectiveBySprintId(@PathVariable Long sprintId) {
        return ResponseEntity.ok(retrospectiveService.getRetrospectiveBySprintId(sprintId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get retrospective", description = "Get retrospective by ID")
    public ResponseEntity<RetrospectiveDto> getRetrospective(@PathVariable Long id) {
        return ResponseEntity.ok(retrospectiveService.getRetrospective(id));
    }
}
