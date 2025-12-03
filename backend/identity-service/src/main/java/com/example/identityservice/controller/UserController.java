    package com.example.identityservice.controller;

    import com.example.identityservice.dto.CreateUserRequest;
    import com.example.identityservice.dto.UserDto;
    import com.example.identityservice.entity.Role;
    import com.example.identityservice.entity.User;
    import com.example.identityservice.service.UserService;
    import io.swagger.v3.oas.annotations.Operation;
    import io.swagger.v3.oas.annotations.security.SecurityRequirement;
    import io.swagger.v3.oas.annotations.tags.Tag;
    import jakarta.validation.Valid;
    import lombok.RequiredArgsConstructor;
    import org.springframework.http.HttpStatus;
    import org.springframework.http.ResponseEntity;
    import org.springframework.security.access.prepost.PreAuthorize;
    import org.springframework.security.core.Authentication;
    import org.springframework.web.bind.annotation.*;

    import java.util.List;

    @RestController
    @RequestMapping("/api/users")
    @RequiredArgsConstructor
    @SecurityRequirement(name = "Bearer Authentication")
    @Tag(name = "User Management", description = "User management endpoints (Admin only)")
    public class UserController {

        private final UserService userService;

        @PostMapping
        @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
        @Operation(summary = "Create user", description = "Create a new user (Admin only)")
        public ResponseEntity<UserDto> createUser(
                @Valid @RequestBody CreateUserRequest request,
                Authentication authentication) {
            String createdByEmail = authentication.getName();
            UserDto user = userService.createUser(request, createdByEmail);
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        }

        @GetMapping
        @PreAuthorize("hasAnyRole('ORGANIZATION_ADMIN', 'PRODUCT_OWNER', 'SCRUM_MASTER')")
        @Operation(summary = "Get all users", description = "Get list of all users")
        public ResponseEntity<List<UserDto>> getAllUsers() {
            return ResponseEntity.ok(userService.getAllUsers());
        }

        @GetMapping("/{id}")
        @PreAuthorize("hasAnyRole('ORGANIZATION_ADMIN', 'PRODUCT_OWNER', 'SCRUM_MASTER')")
        @Operation(summary = "Get user by ID", description = "Get user details by ID")
        public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
            return ResponseEntity.ok(userService.getUserById(id));
        }

        @PatchMapping("/{id}/status")
        @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
        @Operation(summary = "Update user status", description = "Enable or disable a user (Admin only)")
        public ResponseEntity<UserDto> updateUserStatus(
                @PathVariable Long id,
                @RequestParam User.UserStatus status) {
            return ResponseEntity.ok(userService.updateUserStatus(id, status));
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
        @Operation(summary = "Delete user", description = "Delete a user (Admin only)")
        public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        }

        @GetMapping("/by-role/{roleName}")
        @PreAuthorize("hasAnyRole('ORGANIZATION_ADMIN', 'PRODUCT_OWNER', 'SCRUM_MASTER')")
        @Operation(summary = "Get users by role", description = "Get all users with a specific role")
        public ResponseEntity<List<UserDto>> getUsersByRole(@PathVariable Role.RoleName roleName) {
            return ResponseEntity.ok(userService.getUsersByRole(roleName));
        }
    }
