package com.example.identityservice.security;

import com.example.identityservice.entity.Role;
import com.example.identityservice.entity.Role.RoleName;
import com.example.identityservice.entity.User;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "testSecretKeyThatIsLongEnoughForHS256Algorithm");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 3600000L); // 1 hour

        // Create test user with roles
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
    void testGenerateToken_ShouldCreateValidToken() {
        // Arrange
        List<Long> teamIds = List.of(1L, 2L);
        List<Long> projectIds = List.of(10L, 20L);

        // Act
        String token = jwtUtil.generateToken(testUser, teamIds, projectIds);

        // Assert
        assertNotNull(token);
        assertTrue(token.split("\\.").length == 3); // JWT has 3 parts
    }

    @Test
    void testExtractEmail_ShouldReturnCorrectEmail() {
        // Arrange
        String token = jwtUtil.generateToken(testUser, List.of(), List.of());

        // Act
        String email = jwtUtil.extractEmail(token);

        // Assert
        assertEquals("test@example.com", email);
    }

    @Test
    void testExtractUserId_ShouldReturnCorrectUserId() {
        // Arrange
        String token = jwtUtil.generateToken(testUser, List.of(), List.of());

        // Act
        Long userId = jwtUtil.extractUserId(token);

        // Assert
        assertEquals(1L, userId);
    }

    @Test
    void testExtractRoles_ShouldReturnCorrectRoles() {
        // Arrange
        String token = jwtUtil.generateToken(testUser, List.of(), List.of());

        // Act
        List<String> roles = jwtUtil.extractRoles(token);

        // Assert
        assertNotNull(roles);
        assertEquals(1, roles.size());
        assertTrue(roles.contains("DEVELOPER"));
    }

    @Test
    void testValidateToken_ShouldReturnTrueForValidToken() {
        // Arrange
        String token = jwtUtil.generateToken(testUser, List.of(), List.of());

        // Act
        boolean isValid = jwtUtil.validateToken(token, "test@example.com");

        // Assert
        assertTrue(isValid);
    }

    @Test
    void testValidateToken_ShouldReturnFalseForWrongEmail() {
        // Arrange
        String token = jwtUtil.generateToken(testUser, List.of(), List.of());

        // Act
        boolean isValid = jwtUtil.validateToken(token, "wrong@example.com");

        // Assert
        assertFalse(isValid);
    }

    @Test
    void testIsTokenExpired_ShouldReturnFalseForNewToken() {
        // Arrange
        String token = jwtUtil.generateToken(testUser, List.of(), List.of());

        // Act
        boolean isExpired = jwtUtil.isTokenExpired(token);

        // Assert
        assertFalse(isExpired);
    }

    @Test
    void testExtractAllClaims_ShouldContainProjectIds() {
        // Arrange
        List<Long> projectIds = List.of(10L, 20L, 30L);
        String token = jwtUtil.generateToken(testUser, List.of(), projectIds);

        // Act
        Claims claims = jwtUtil.extractAllClaims(token);
        List<?> extractedProjectIds = claims.get("projectIds", List.class);

        // Assert
        assertNotNull(extractedProjectIds);
        assertEquals(3, extractedProjectIds.size());
    }

    @Test
    void testExtractAllClaims_ShouldContainTeamIds() {
        // Arrange
        List<Long> teamIds = List.of(1L, 2L);
        String token = jwtUtil.generateToken(testUser, teamIds, List.of());

        // Act
        Claims claims = jwtUtil.extractAllClaims(token);
        List<?> extractedTeamIds = claims.get("teamIds", List.class);

        // Assert
        assertNotNull(extractedTeamIds);
        assertEquals(2, extractedTeamIds.size());
    }

    @Test
    void testGenerateToken_ShouldIncludeUserDetails() {
        // Arrange
        List<Long> teamIds = List.of(1L);
        List<Long> projectIds = List.of(10L);

        // Act
        String token = jwtUtil.generateToken(testUser, teamIds, projectIds);
        Claims claims = jwtUtil.extractAllClaims(token);

        // Assert
        assertEquals(1L, claims.get("userId", Long.class));
        assertEquals("test@example.com", claims.get("email", String.class));
        assertEquals("test@example.com", claims.get("name", String.class));
        assertNotNull(claims.get("roles", List.class));
    }
}
