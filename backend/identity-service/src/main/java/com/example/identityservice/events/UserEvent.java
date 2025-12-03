package com.example.identityservice.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEvent {
    private Long userId;
    private String email;
    private String fullName;
    private List<String> roles;
    private String action; // CREATED, UPDATED, DELETED, ACTIVATED, DEACTIVATED
    private Instant timestamp;
    private Long performedBy;
}
