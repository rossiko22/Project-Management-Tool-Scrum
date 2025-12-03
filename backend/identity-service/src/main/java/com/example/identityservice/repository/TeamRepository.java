package com.example.identityservice.repository;

import com.example.identityservice.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    @Query("SELECT t FROM Team t WHERE :user MEMBER OF t.members")
    List<Team> findTeamsByMember(com.example.identityservice.entity.User user);

    List<Team> findByProductOwnerId(Long productOwnerId);

    List<Team> findByScrumMasterId(Long scrumMasterId);

    List<Team> findByProjectId(Long projectId);
}
