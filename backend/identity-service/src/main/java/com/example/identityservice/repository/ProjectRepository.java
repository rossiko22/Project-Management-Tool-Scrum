package com.example.identityservice.repository;

import com.example.identityservice.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByStatus(Project.ProjectStatus status);

    List<Project> findByTeamId(Long teamId);

    List<Project> findByOrganizationId(Long organizationId);
}
