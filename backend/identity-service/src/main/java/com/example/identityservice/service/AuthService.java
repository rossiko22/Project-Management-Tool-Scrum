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

        // Get user's team IDs and project IDs
        List<Long> teamIds = teamRepository.findTeamsByMember(user).stream()
                .map(team -> team.getId())
                .toList();

        List<Long> projectIds = teamIds.stream()
                .flatMap(teamId -> projectRepository.findByTeamId(teamId).stream())
                .map(project -> project.getId())
                .distinct()
                .toList();

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
