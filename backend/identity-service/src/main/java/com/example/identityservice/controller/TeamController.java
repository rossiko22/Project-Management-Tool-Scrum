package com.example.identityservice.controller;

import com.example.identityservice.entity.Team;
import com.example.identityservice.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZATION_ADMIN', 'PRODUCT_OWNER')")
    public ResponseEntity<Team> createTeam(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Long userId = Long.parseLong(userDetails.getUsername());

        String name = (String) request.get("name");
        Long projectId = Long.parseLong(request.get("projectId").toString());

        Team team = teamService.createTeam(name, projectId, userId);
        return ResponseEntity.ok(team);
    }

    @PostMapping("/{teamId}/members")
    @PreAuthorize("hasAnyRole('ORGANIZATION_ADMIN', 'SCRUM_MASTER')")
    public ResponseEntity<Team> addMember(
            @PathVariable Long teamId,
            @RequestBody Map<String, Object> request) {
        Long userId = Long.parseLong(request.get("userId").toString());
        String role = (String) request.get("role");

        Team team = teamService.addMember(teamId, userId, role);
        return ResponseEntity.ok(team);
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    @PreAuthorize("hasAnyRole('ORGANIZATION_ADMIN', 'SCRUM_MASTER')")
    public ResponseEntity<Team> removeMember(
            @PathVariable Long teamId,
            @PathVariable Long userId) {
        Team team = teamService.removeMember(teamId, userId);
        return ResponseEntity.ok(team);
    }

    @GetMapping
    public ResponseEntity<List<Team>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Team> getTeamById(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Team>> getTeamsByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(teamService.getTeamsByProject(projectId));
    }
}
