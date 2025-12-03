package com.example.identityservice.service;

import com.example.identityservice.entity.Project;
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
}
