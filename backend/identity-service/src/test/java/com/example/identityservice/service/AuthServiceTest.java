package com.example.identityservice.service;

import com.example.identityservice.dto.LoginRequest;
import com.example.identityservice.dto.LoginResponse;
import com.example.identityservice.entity.Role;
import com.example.identityservice.entity.Role.RoleName;
import com.example.identityservice.entity.User;
import com.example.identityservice.repository.ProjectRepository;
import com.example.identityservice.repository.TeamRepository;
import com.example.identityservice.repository.UserRepository;
import com.example.identityservice.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");

        Role role = new Role();
        role.setName(RoleName.DEVELOPER);
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        testUser.setRoles(roles);
    }

    @Test
    void testLogin_Success() {
        // Arrange
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));
        when(teamRepository.findTeamsByMember(testUser))
                .thenReturn(List.of());
        when(jwtUtil.generateToken(eq(testUser), any(), any()))
                .thenReturn("test-jwt-token");

        // Act
        LoginResponse response = authService.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals("test-jwt-token", response.getToken());
        assertEquals("Bearer", response.getType());
        assertNotNull(response.getUser());
        assertEquals("test@example.com", response.getUser().getEmail());

        verify(authenticationManager).authenticate(any());
        verify(userRepository).findByEmail("test@example.com");
        verify(userRepository).save(testUser);
    }

    @Test
    void testLogin_UserNotFound() {
        // Arrange
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> authService.login(loginRequest));
    }

    @Test
    void testGetCurrentUser_Success() {
        // Arrange
        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));

        // Act
        var userDto = authService.getCurrentUser("test@example.com");

        // Assert
        assertNotNull(userDto);
        assertEquals("test@example.com", userDto.getEmail());
        assertEquals("Test", userDto.getFirstName());
        assertEquals("User", userDto.getLastName());
    }

    @Test
    void testGetCurrentUser_UserNotFound() {
        // Arrange
        when(userRepository.findByEmail("notfound@example.com"))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class,
            () -> authService.getCurrentUser("notfound@example.com"));
    }

    @Test
    void testLogin_UpdatesLastLogin() {
        // Arrange
        when(authenticationManager.authenticate(any()))
                .thenReturn(authentication);
        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(testUser));
        when(teamRepository.findTeamsByMember(testUser))
                .thenReturn(List.of());
        when(jwtUtil.generateToken(any(), any(), any()))
                .thenReturn("token");

        // Act
        authService.login(loginRequest);

        // Assert
        assertNotNull(testUser.getLastLogin());
        verify(userRepository).save(testUser);
    }
}
