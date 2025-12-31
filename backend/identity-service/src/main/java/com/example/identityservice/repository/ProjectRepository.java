package com.example.identityservice.repository;

import com.example.identityservice.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByStatus(Project.ProjectStatus status);

    // Changed from findByTeamId to findByTeam_Id to match the entity field structure
    // Project entity has: @JoinColumn(name = "team_id") private Team team;
    // So we query by team.id using findByTeam_Id
    List<Project> findByTeam_Id(Long teamId);

    List<Project> findByOrganizationId(Long organizationId);

    // Eagerly fetch project with team and all team members
    @Query("SELECT DISTINCT p FROM Project p " +
           "LEFT JOIN FETCH p.team t " +
           "LEFT JOIN FETCH t.productOwner " +
           "LEFT JOIN FETCH t.scrumMaster " +
           "LEFT JOIN FETCH t.members " +
           "WHERE p.id = :id")
    Optional<Project> findByIdWithTeam(@Param("id") Long id);

    // Eagerly fetch all projects with teams and members
    @Query("SELECT DISTINCT p FROM Project p " +
           "LEFT JOIN FETCH p.team t " +
           "LEFT JOIN FETCH t.productOwner " +
           "LEFT JOIN FETCH t.scrumMaster " +
           "LEFT JOIN FETCH t.members")
    List<Project> findAllWithTeams();

    // Eagerly fetch projects by IDs with teams and members
    @Query("SELECT DISTINCT p FROM Project p " +
           "LEFT JOIN FETCH p.team t " +
           "LEFT JOIN FETCH t.productOwner " +
           "LEFT JOIN FETCH t.scrumMaster " +
           "LEFT JOIN FETCH t.members " +
           "WHERE p.id IN :ids")
    List<Project> findByIdsWithTeams(@Param("ids") List<Long> ids);
}
