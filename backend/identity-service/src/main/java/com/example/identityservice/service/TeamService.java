package com.example.identityservice.service;

import com.example.identityservice.entity.Team;
import com.example.identityservice.entity.User;
import com.example.identityservice.events.TeamEvent;
import com.example.identityservice.repository.TeamRepository;
import com.example.identityservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public Team createTeam(String name, Long projectId, Long createdById) {
        Team team = Team.builder()
                .name(name)
                .projectId(projectId)
                .build();

        team = teamRepository.save(team);

        // Publish team created event
        TeamEvent event = TeamEvent.builder()
                .teamId(team.getId())
                .teamName(team.getName())
                .projectId(projectId)
                .action("CREATED")
                .memberIds(List.of())
                .timestamp(Instant.now())
                .performedBy(createdById)
                .build();
        eventPublisher.publishTeamEvent(event);

        return team;
    }

    @Transactional
    public Team addMember(Long teamId, Long userId, String role) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        team.getMembers().add(user);
        team = teamRepository.save(team);

        // Publish member added event
        TeamEvent event = TeamEvent.builder()
                .teamId(team.getId())
                .teamName(team.getName())
                .projectId(team.getProjectId())
                .action("MEMBER_ADDED")
                .userId(userId)
                .userRole(role)
                .memberIds(team.getMembers().stream()
                        .map(User::getId)
                        .collect(Collectors.toList()))
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishTeamEvent(event);

        return team;
    }

    @Transactional
    public Team removeMember(Long teamId, Long userId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        team.getMembers().remove(user);
        team = teamRepository.save(team);

        // Publish member removed event
        TeamEvent event = TeamEvent.builder()
                .teamId(team.getId())
                .teamName(team.getName())
                .projectId(team.getProjectId())
                .action("MEMBER_REMOVED")
                .userId(userId)
                .memberIds(team.getMembers().stream()
                        .map(User::getId)
                        .collect(Collectors.toList()))
                .timestamp(Instant.now())
                .build();
        eventPublisher.publishTeamEvent(event);

        return team;
    }

    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    public Team getTeamById(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));
    }

    public List<Team> getTeamsByProject(Long projectId) {
        return teamRepository.findByProjectId(projectId);
    }
}
