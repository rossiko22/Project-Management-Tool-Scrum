package com.example.scrumcoreservice.dto;

import com.example.scrumcoreservice.entity.Sprint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintDto {
    private Long id;
    private Long projectId;
    private String name;
    private String goal;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer lengthWeeks;
    private String status;
    private Integer teamCapacity;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    public static SprintDto fromEntity(Sprint sprint) {
        return SprintDto.builder()
                .id(sprint.getId())
                .projectId(sprint.getProjectId())
                .name(sprint.getName())
                .goal(sprint.getGoal())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .lengthWeeks(sprint.getLengthWeeks())
                .status(sprint.getStatus().name())
                .teamCapacity(sprint.getTeamCapacity())
                .createdBy(sprint.getCreatedBy())
                .createdAt(sprint.getCreatedAt())
                .startedAt(sprint.getStartedAt())
                .endedAt(sprint.getEndedAt())
                .build();
    }
}
