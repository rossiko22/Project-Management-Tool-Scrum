package com.example.identityservice.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationProvider implements AuthenticationProvider {

    private final UserDetailsService userDetailsService;

    @Qualifier("myPasswordEncoder")
    private final PasswordEncoder passwordEncoder;

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String username = authentication.getName();
        String rawPassword = authentication.getCredentials().toString();

        // Load user from database
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // DEBUG LOGS (optional)
        System.out.println("RAW PASSWORD: " + rawPassword);
        System.out.println("HASH IN DB: " + userDetails.getPassword());
        System.out.println("PASSWORD MATCH: " + passwordEncoder.matches(rawPassword, userDetails.getPassword()));
        System.out.println("---------------------------------------------");

        // Verify password
        if (!passwordEncoder.matches(rawPassword, userDetails.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        // Check if account is enabled
        if (!userDetails.isEnabled()) {
            throw new DisabledException("User account is disabled");
        }

        // Return authenticated token
        return new UsernamePasswordAuthenticationToken(
                userDetails,
                null, // credentials are null after authentication
                userDetails.getAuthorities()
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
