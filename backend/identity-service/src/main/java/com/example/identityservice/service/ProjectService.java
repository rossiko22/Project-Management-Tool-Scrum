package com.example.identityservice.service;

import com.example.identityservice.dto.CreateProjectRequest;
import com.example.identityservice.entity.Project;
import com.example.identityservice.entity.Team;
import com.example.identityservice.events.ProjectEvent;
import com.example.identityservice.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final TeamService teamService;
    private final EventPublisher eventPublisher;

    @Transactional
    public Project createProject(String name, String description, Long organizationId, Long createdById) {
        Project project = Project.builder()
                .name(name)
                .description(description)
                .organizationId(organizationId)
                .build();

        project = projectRepository.save(project);

        // Publish project created event
        ProjectEvent event = ProjectEvent.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .description(project.getDescription())
                .organizationId(organizationId)
                .action("CREATED")
                .teamIds(List.of())
                .timestamp(Instant.now())
                .performedBy(createdById)
                .build();
        eventPublisher.publishProjectEvent(event);

        return project;
    }

    @Transactional
    public Project createProjectWithTeam(CreateProjectRequest request, Long createdById) {
        // Create project
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .organizationId(request.getOrganizationId())
                .defaultSprintLength(request.getDefaultSprintLength() != null ? request.getDefaultSprintLength() : 2)
                .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
                .build();

        project = projectRepository.save(project);

        // Create team if any team members are specified
        if (request.getProductOwnerId() != null || request.getScrumMasterId() != null ||
                (request.getDeveloperIds() != null && !request.getDeveloperIds().isEmpty())) {

            String teamName = request.getName() + " Team";
            Team team = teamService.createTeamWithMembers(
                    teamName,
                    "Team for " + request.getName(),
                    project.getId(),
                    request.getProductOwnerId(),
                    request.getScrumMasterId(),
                    request.getDeveloperIds(),
                    createdById
            );

            project.setTeam(team);
            project = projectRepository.save(project);
        }

        // Publish project created event
        ProjectEvent event = ProjectEvent.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .description(project.getDescription())
                .organizationId(request.getOrganizationId())
                .action("CREATED")
                .teamIds(project.getTeam() != null ? List.of(project.getTeam().getId()) : List.of())
                .timestamp(Instant.now())
                .performedBy(createdById)
                .build();
        eventPublisher.publishProjectEvent(event);

        return project;
    }

    @Transactional
    public Project assignTeam(Long projectId, Long productOwnerId, Long scrumMasterId,
                             List<Long> developerIds, Long performedBy) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Team team;
        if (project.getTeam() != null) {
            // Update existing team
            team = project.getTeam();
            if (productOwnerId != null) {
                teamService.setProductOwner(team.getId(), productOwnerId);
            }
            if (scrumMasterId != null) {
                teamService.setScrumMaster(team.getId(), scrumMasterId);
            }
            if (developerIds != null) {
                // Remove old members and add new ones
                team.getMembers().clear();
                for (Long devId : developerIds) {
                    teamService.addMember(team.getId(), devId, "DEVELOPER");
                }
            }
        } else {
            // Create new team
            String teamName = project.getName() + " Team";
            team = teamService.createTeamWithMembers(
                    teamName,
                    "Team for " + project.getName(),
                    project.getId(),
                    productOwnerId,
                    scrumMasterId,
                    developerIds,
                    performedBy
            );
            project.setTeam(team);
            project = projectRepository.save(project);
        }

        return project;
    }

    @Transactional
    public Project updateProject(Long id, String name, String description) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setName(name);
        project.setDescription(description);
        project = projectRepository.save(project);

        // Publish project updated event
        ProjectEvent event = ProjectEvent.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .description(project.getDescription())
                .organizationId(project.getOrganizationId())
                .action("UPDATED")
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishProjectEvent(event);

        return project;
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    public List<Project> getProjectsByOrganization(Long organizationId) {
        return projectRepository.findByOrganizationId(organizationId);
    }

    public List<Project> getProjectsByIds(List<Long> projectIds) {
        if (projectIds == null || projectIds.isEmpty()) {
            return List.of();
        }
        return projectRepository.findAllById(projectIds);
    }
}
