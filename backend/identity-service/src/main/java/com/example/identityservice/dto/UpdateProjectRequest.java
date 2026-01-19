package com.example.identityservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProjectRequest {
    private String name;
    private String description;
    private Integer defaultSprintLength;
    private String timezone;
    private String status;
}
