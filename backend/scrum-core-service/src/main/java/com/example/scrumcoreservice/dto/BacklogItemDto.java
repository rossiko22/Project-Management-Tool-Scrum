package com.example.scrumcoreservice.dto;

import com.example.scrumcoreservice.entity.ProductBacklogItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BacklogItemDto {
    private Long id;
    private Long projectId;
    private String title;
    private String description;
    private String type;
    private Integer storyPoints;
    private Integer priority;
    private Integer position;
    private String status;
    private String acceptanceCriteria;
    private Long createdBy;
    private String createdByRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BacklogItemDto fromEntity(ProductBacklogItem item) {
        return BacklogItemDto.builder()
                .id(item.getId())
                .projectId(item.getProjectId())
                .title(item.getTitle())
                .description(item.getDescription())
                .type(item.getType().name())
                .storyPoints(item.getStoryPoints())
                .priority(item.getPriority())
                .position(item.getPosition())
                .status(item.getStatus().name())
                .acceptanceCriteria(item.getAcceptanceCriteria())
                .createdBy(item.getCreatedBy())
                .createdByRole(item.getCreatedByRole())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
