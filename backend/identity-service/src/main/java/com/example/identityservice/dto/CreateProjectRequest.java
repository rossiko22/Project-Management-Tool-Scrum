package com.example.identityservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    private String name;

    private String description;

    @NotNull(message = "Organization ID is required")
    private Long organizationId;

    private Integer defaultSprintLength;

    private String timezone;

    // Team assignment during creation
    private Long productOwnerId;
    private Long scrumMasterId;
    private List<Long> developerIds;
}
