package com.example.scrumcoreservice.dto;

import com.example.scrumcoreservice.entity.Impediment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpedimentDto {
    private Long id;
    private Long sprintId;
    private String title;
    private String description;
    private String status;
    private Long reportedBy;
    private Long assignedTo;
    private Long resolvedBy;
    private LocalDateTime reportedAt;
    private LocalDateTime resolvedAt;
    private String resolution;

    public static ImpedimentDto fromEntity(Impediment impediment) {
        return ImpedimentDto.builder()
                .id(impediment.getId())
                .sprintId(impediment.getSprint() != null ? impediment.getSprint().getId() : null)
                .title(impediment.getTitle())
                .description(impediment.getDescription())
                .status(impediment.getStatus().name())
                .reportedBy(impediment.getReportedBy())
                .assignedTo(impediment.getAssignedTo())
                .resolvedBy(impediment.getResolvedBy())
                .reportedAt(impediment.getReportedAt())
                .resolvedAt(impediment.getResolvedAt())
                .resolution(impediment.getResolution())
                .build();
    }
}
