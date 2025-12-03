package com.example.identityservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Application configuration for Spring Boot 4 / Spring Security 7.
 *
 * Provides core beans like PasswordEncoder.
 */
@Configuration
public class ApplicationConfig {

    /**
     * BCrypt password encoder with strength 10.
     *
     * Example hash for "admin123":
     * $2a$10$ZQH3c7vPNFJDc5bE.KQbFO0vN0vGjVjGjXZH0fW7L5GQ5YqKx0XfC
     */

    @Bean(name = "myPasswordEncoder")
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
}
