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
public class AddItemToSprintRequest {

    @NotNull(message = "Backlog item ID is required")
    private Long backlogItemId;

    @NotEmpty(message = "At least one team member ID must be provided for approval")
    private List<Long> assignedDeveloperIds; // Now contains all team member IDs (developers + PO)
}
