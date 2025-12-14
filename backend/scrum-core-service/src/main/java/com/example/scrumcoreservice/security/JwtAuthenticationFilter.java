package com.example.scrumcoreservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String email = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                email = jwtUtil.extractEmail(jwt);
            } catch (Exception e) {
                // Token is invalid
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                if (!jwtUtil.isTokenExpired(jwt)) {
                    List<String> roles = jwtUtil.extractRoles(jwt);
                    List<Long> teamIds = jwtUtil.extractTeamIds(jwt);
                    List<Long> projectIds = jwtUtil.extractProjectIds(jwt);

                    List<SimpleGrantedAuthority> authorities = roles.stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                            .collect(Collectors.toList());

                    System.out.println("=== JWT AUTHENTICATION ===");
                    System.out.println("Email: " + email);
                    System.out.println("Roles: " + roles);
                    System.out.println("Team IDs: " + teamIds);
                    System.out.println("Project IDs: " + projectIds);
                    System.out.println("Authorities: " + authorities);
                    System.out.println("==========================");

                    // Create UserPrincipal with all user information from JWT
                    UserPrincipal userPrincipal = new UserPrincipal(
                            jwtUtil.extractUserId(jwt),
                            email,
                            roles,
                            teamIds,
                            projectIds,
                            authorities
                    );

                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(userPrincipal, null, authorities);
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            } catch (Exception e) {
                System.out.println("=== JWT VALIDATION FAILED ===");
                System.out.println("Error: " + e.getMessage());
                e.printStackTrace();
                System.out.println("=============================");
            }
        }

        chain.doFilter(request, response);
    }
}
