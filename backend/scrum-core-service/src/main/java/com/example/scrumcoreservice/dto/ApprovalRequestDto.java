package com.example.scrumcoreservice.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalRequestDto {

    @NotNull(message = "Backlog item ID is required")
    private Long backlogItemId;

    @NotNull(message = "Sprint ID is required")
    private Long sprintId;

    @NotEmpty(message = "At least one developer must be assigned")
    private List<Long> assignedDeveloperIds;
}
