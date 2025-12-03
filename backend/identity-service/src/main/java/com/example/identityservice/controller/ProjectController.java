package com.example.identityservice.controller;

import com.example.identityservice.entity.Project;
import com.example.identityservice.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
    public ResponseEntity<Project> createProject(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.getUsername());

        String name = (String) request.get("name");
        String description = (String) request.get("description");
        Long organizationId = Long.parseLong(request.get("organizationId").toString());

        Project project = projectService.createProject(name, description, organizationId, userId);
        return ResponseEntity.ok(project);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZATION_ADMIN', 'PRODUCT_OWNER')")
    public ResponseEntity<Project> updateProject(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String name = request.get("name");
        String description = request.get("description");

        Project project = projectService.updateProject(id, name, description);
        return ResponseEntity.ok(project);
    }

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<Project>> getProjectsByOrganization(@PathVariable Long organizationId) {
        return ResponseEntity.ok(projectService.getProjectsByOrganization(organizationId));
    }
}
