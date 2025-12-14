package com.example.identityservice.repository;

import com.example.identityservice.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByStatus(Project.ProjectStatus status);

    // Changed from findByTeamId to findByTeam_Id to match the entity field structure
    // Project entity has: @JoinColumn(name = "team_id") private Team team;
    // So we query by team.id using findByTeam_Id
    List<Project> findByTeam_Id(Long teamId);

    List<Project> findByOrganizationId(Long organizationId);
}
