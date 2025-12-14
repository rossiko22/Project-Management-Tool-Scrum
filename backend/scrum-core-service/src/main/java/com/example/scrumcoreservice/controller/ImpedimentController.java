package com.example.scrumcoreservice.controller;

import com.example.scrumcoreservice.dto.ImpedimentDto;
import com.example.scrumcoreservice.entity.Impediment;
import com.example.scrumcoreservice.security.UserPrincipal;
import com.example.scrumcoreservice.service.ImpedimentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/impediments")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Impediments", description = "Impediment tracking and management endpoints")
public class ImpedimentController {

    private final ImpedimentService impedimentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Create impediment", description = "Create a new impediment (Scrum Master or Developers)")
    public ResponseEntity<ImpedimentDto> createImpediment(
            @RequestBody CreateImpedimentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ImpedimentDto impediment = impedimentService.createImpediment(
                request.getSprintId(),
                request.getTitle(),
                request.getDescription(),
                principal.getUserId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(impediment);
    }

    @GetMapping("/sprint/{sprintId}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get sprint impediments", description = "Get all impediments for a sprint")
    public ResponseEntity<List<ImpedimentDto>> getSprintImpediments(@PathVariable Long sprintId) {
        return ResponseEntity.ok(impedimentService.getSprintImpediments(sprintId));
    }

    @GetMapping("/sprint/{sprintId}/open")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get open impediments", description = "Get all open impediments for a sprint")
    public ResponseEntity<List<ImpedimentDto>> getOpenImpediments(@PathVariable Long sprintId) {
        return ResponseEntity.ok(impedimentService.getOpenImpediments(sprintId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PRODUCT_OWNER', 'SCRUM_MASTER', 'DEVELOPER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Get impediment", description = "Get impediment details by ID")
    public ResponseEntity<ImpedimentDto> getImpediment(@PathVariable Long id) {
        return ResponseEntity.ok(impedimentService.getImpediment(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Update impediment status", description = "Update impediment status (Scrum Master only)")
    public ResponseEntity<ImpedimentDto> updateImpedimentStatus(
            @PathVariable Long id,
            @RequestParam Impediment.ImpedimentStatus status) {
        return ResponseEntity.ok(impedimentService.updateImpedimentStatus(id, status));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Assign impediment", description = "Assign impediment for resolution (Scrum Master only)")
    public ResponseEntity<ImpedimentDto> assignImpediment(
            @PathVariable Long id,
            @RequestParam Long assignedTo) {
        return ResponseEntity.ok(impedimentService.assignImpediment(id, assignedTo));
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Resolve impediment", description = "Mark impediment as resolved with resolution notes (Scrum Master only)")
    public ResponseEntity<ImpedimentDto> resolveImpediment(
            @PathVariable Long id,
            @RequestParam String resolution,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(impedimentService.resolveImpediment(id, principal.getUserId(), resolution));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SCRUM_MASTER', 'ORGANIZATION_ADMIN')")
    @Operation(summary = "Delete impediment", description = "Delete an impediment (Scrum Master only)")
    public ResponseEntity<Void> deleteImpediment(@PathVariable Long id) {
        impedimentService.deleteImpediment(id);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class CreateImpedimentRequest {
        private Long sprintId;
        private String title;
        private String description;
    }
}
