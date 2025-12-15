package com.example.scrumcoreservice.dto;

import com.example.scrumcoreservice.entity.SprintRetrospective;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class RetrospectiveDto {

    private Long id;
    private Long sprintId;
    private Long facilitatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> wentWell;
    private List<String> improvements;
    private List<String> actionItems;
    private String overallNotes;
    private Integer teamMood;

    public static RetrospectiveDto fromEntity(SprintRetrospective entity) {
        return RetrospectiveDto.builder()
                .id(entity.getId())
                .sprintId(entity.getSprintId())
                .facilitatedBy(entity.getFacilitatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .wentWell(entity.getWentWell())
                .improvements(entity.getImprovements())
                .actionItems(entity.getActionItems())
                .overallNotes(entity.getOverallNotes())
                .teamMood(entity.getTeamMood())
                .build();
    }
}
