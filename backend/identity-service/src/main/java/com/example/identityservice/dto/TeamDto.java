package com.example.identityservice.dto;

import com.example.identityservice.entity.Team;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamDto {
    private Long id;
    private String name;
    private String description;
    private Long projectId;
    private UserDto productOwner;
    private UserDto scrumMaster;
    private List<UserDto> developers;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TeamDto fromEntity(Team team) {
        TeamDtoBuilder builder = TeamDto.builder()
                .id(team.getId())
                .name(team.getName())
                .description(team.getDescription())
                .projectId(team.getProjectId())
                .createdAt(team.getCreatedAt())
                .updatedAt(team.getUpdatedAt());

        if (team.getProductOwner() != null) {
            builder.productOwner(UserDto.fromEntity(team.getProductOwner()));
        }

        if (team.getScrumMaster() != null) {
            builder.scrumMaster(UserDto.fromEntity(team.getScrumMaster()));
        }

        if (team.getMembers() != null && !team.getMembers().isEmpty()) {
            builder.developers(team.getMembers().stream()
                    .map(UserDto::fromEntity)
                    .collect(Collectors.toList()));
        }

        return builder.build();
    }
}
