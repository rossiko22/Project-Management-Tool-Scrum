package com.example.identityservice.dto;

import com.example.identityservice.entity.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {
    private Long id;
    private String name;
    private String description;
    private Long organizationId;
    private String status;
    private Integer defaultSprintLength;
    private String timezone;
    private TeamDto team;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProjectDto fromEntity(Project project) {
        ProjectDtoBuilder builder = ProjectDto.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .organizationId(project.getOrganizationId())
                .status(project.getStatus().name())
                .defaultSprintLength(project.getDefaultSprintLength())
                .timezone(project.getTimezone())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt());

        if (project.getTeam() != null) {
            builder.team(TeamDto.fromEntity(project.getTeam()));
        }

        return builder.build();
    }
}
