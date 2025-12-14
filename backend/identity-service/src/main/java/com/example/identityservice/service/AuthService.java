package com.example.identityservice.service;

import com.example.identityservice.dto.LoginRequest;
import com.example.identityservice.dto.LoginResponse;
import com.example.identityservice.dto.UserDto;
import com.example.identityservice.entity.User;
import com.example.identityservice.repository.ProjectRepository;
import com.example.identityservice.repository.TeamRepository;
import com.example.identityservice.repository.UserRepository;
import com.example.identityservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final JwtUtil jwtUtil;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Get user's team IDs from all roles (member, product owner, scrum master)
        List<Long> teamIds = teamRepository.findTeamsByMember(user).stream()
                .map(team -> team.getId())
                .toList();

        // Also include teams where user is product owner
        List<Long> poTeamIds = teamRepository.findByProductOwnerId(user.getId()).stream()
                .map(team -> team.getId())
                .toList();

        // Also include teams where user is scrum master
        List<Long> smTeamIds = teamRepository.findByScrumMasterId(user.getId()).stream()
                .map(team -> team.getId())
                .toList();

        // Combine all team IDs
        teamIds = java.util.stream.Stream.of(teamIds, poTeamIds, smTeamIds)
                .flatMap(List::stream)
                .distinct()
                .toList();

        List<Long> projectIds = teamIds.stream()
                .flatMap(teamId -> projectRepository.findByTeam_Id(teamId).stream())
                .map(project -> project.getId())
                .distinct()
                .toList();

        System.out.println("=== JWT GENERATION DEBUG ===");
        System.out.println("User: " + user.getEmail());
        System.out.println("Team IDs: " + teamIds);
        System.out.println("Project IDs: " + projectIds);
        System.out.println("===========================");

        String token = jwtUtil.generateToken(user, teamIds, projectIds);

        System.out.println("JWT GENERATED: " + token);

        return LoginResponse.builder()
                .token(token)
                .type("Bearer")
                .user(UserDto.fromEntity(user))
                .build();
    }

    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserDto.fromEntity(user);
    }
}
