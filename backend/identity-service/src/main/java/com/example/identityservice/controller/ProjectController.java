package com.example.identityservice.controller;

import com.example.identityservice.dto.AssignTeamRequest;
import com.example.identityservice.dto.CreateProjectRequest;
import com.example.identityservice.dto.ProjectDto;
import com.example.identityservice.dto.UpdateProjectRequest;
import com.example.identityservice.entity.Project;
import com.example.identityservice.security.JwtUtil;
import com.example.identityservice.service.ProjectService;
import com.example.identityservice.service.RabbitMQLoggerService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final JwtUtil jwtUtil;
    private final RabbitMQLoggerService logger;

    private String getTokenFromRequest(HttpServletRequest request) {
        // Try to get JWT from cookie
        if (request.getCookies() != null) {
            Cookie jwtCookie = Arrays.stream(request.getCookies())
                    .filter(cookie -> "jwt".equals(cookie.getName()))
                    .findFirst()
                    .orElse(null);

            if (jwtCookie != null) {
                return jwtCookie.getValue();
            }
        }

        // Fallback to Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        throw new RuntimeException("Unable to extract token from request");
    }

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String token = getTokenFromRequest(request);
        return jwtUtil.extractUserId(token);
    }

    @SuppressWarnings("unchecked")
    private List<Long> getProjectIdsFromRequest(HttpServletRequest request) {
        String token = getTokenFromRequest(request);
        Object projectIds = jwtUtil.extractAllClaims(token).get("projectIds");
        if (projectIds instanceof List) {
            return ((List<?>) projectIds).stream()
                    .map(id -> {
                        if (id instanceof Integer) {
                            return ((Integer) id).longValue();
                        } else if (id instanceof Long) {
                            return (Long) id;
                        }
                        return null;
                    })
                    .filter(id -> id != null)
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    private boolean hasAccessToProject(HttpServletRequest request, Long projectId, Authentication authentication) {
        // Organization admins have access to all projects
        if (authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ORGANIZATION_ADMIN"))) {
            return true;
        }

        // Check if project ID is in user's authorized project list
        List<Long> userProjectIds = getProjectIdsFromRequest(request);
        return userProjectIds.contains(projectId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
    public ResponseEntity<ProjectDto> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            HttpServletRequest httpRequest) {

        String url = httpRequest.getRequestURI();
        logger.logInfo("Creating new project: " + request.getName(), url);

        try {
            Long userId = getUserIdFromRequest(httpRequest);
            Project project = projectService.createProjectWithTeam(request, userId);
            logger.logInfo("Project created successfully. ID: " + project.getId(), url);
            return ResponseEntity.ok(ProjectDto.fromEntity(project));
        } catch (Exception e) {
            logger.logError("Failed to create project: " + e.getMessage(), url);
            throw e;
        }
    }

    @PostMapping("/{id}/assign-team")
    @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
    public ResponseEntity<ProjectDto> assignTeam(
            @PathVariable Long id,
            @Valid @RequestBody AssignTeamRequest request,
            HttpServletRequest httpRequest) {

        Long userId = getUserIdFromRequest(httpRequest);
        Project project = projectService.assignTeam(
                id,
                request.getProductOwnerId(),
                request.getScrumMasterId(),
                request.getDeveloperIds(),
                userId
        );
        return ResponseEntity.ok(ProjectDto.fromEntity(project));
    }

    @GetMapping
    public ResponseEntity<List<ProjectDto>> getAllProjects(
            HttpServletRequest httpRequest,
            Authentication authentication) {

        String url = httpRequest.getRequestURI();
        logger.logInfo("Getting all projects for user: " + authentication.getName(), url);

        List<ProjectDto> projects;

        // Organization admins can see all projects
        if (authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ORGANIZATION_ADMIN"))) {
            projects = projectService.getAllProjects()
                    .stream()
                    .map(ProjectDto::fromEntity)
                    .collect(Collectors.toList());
        } else {
            // Other users can only see their assigned projects
            List<Long> projectIds = getProjectIdsFromRequest(httpRequest);
            projects = projectService.getProjectsByIds(projectIds)
                    .stream()
                    .map(ProjectDto::fromEntity)
                    .collect(Collectors.toList());
        }

        logger.logInfo("Retrieved " + projects.size() + " projects", url);
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProjectById(
            @PathVariable Long id,
            HttpServletRequest httpRequest,
            Authentication authentication) {

        String url = httpRequest.getRequestURI();
        logger.logInfo("Getting project by ID: " + id, url);

        // Check if user has access to this project
        if (!hasAccessToProject(httpRequest, id, authentication)) {
            logger.logWarn("Access denied to project " + id + " for user: " + authentication.getName(), url);
            return ResponseEntity.status(403).build();
        }

        Project project = projectService.getProjectById(id);
        logger.logInfo("Retrieved project: " + project.getName(), url);
        return ResponseEntity.ok(ProjectDto.fromEntity(project));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
    public ResponseEntity<ProjectDto> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request,
            HttpServletRequest httpRequest) {

        String url = httpRequest.getRequestURI();
        logger.logInfo("Updating project: " + id, url);

        Project project = projectService.updateProject(id, request);
        logger.logInfo("Project updated successfully. ID: " + project.getId(), url);
        return ResponseEntity.ok(ProjectDto.fromEntity(project));
    }

    @GetMapping("/organization/{organizationId}")
    public ResponseEntity<List<ProjectDto>> getProjectsByOrganization(@PathVariable Long organizationId) {
        List<ProjectDto> projects = projectService.getProjectsByOrganization(organizationId)
                .stream()
                .map(ProjectDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(projects);
    }
}
