package com.example.identityservice.config;

import com.example.identityservice.security.CustomAuthenticationProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;

/**
 * Authentication configuration for Spring Boot 4 / Spring Security 7.
 *
 * Provides AuthenticationManager using our CustomAuthenticationProvider.
 */
@Configuration
@RequiredArgsConstructor
public class AuthenticationConfig {

    private final CustomAuthenticationProvider customAuthenticationProvider;

    /**
     * AuthenticationManager using our custom provider.
     *
     * Spring Security 7 approach: Use ProviderManager with custom AuthenticationProvider.
     * This avoids the DaoAuthenticationProvider compatibility issues.
     */
    @Bean
    public AuthenticationManager authenticationManager() {
        return new ProviderManager(customAuthenticationProvider);
    }
}
