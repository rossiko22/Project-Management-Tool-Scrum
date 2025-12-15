package com.example.scrumcoreservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreateRetrospectiveRequest {

    @NotNull(message = "Sprint ID is required")
    private Long sprintId;

    private List<String> wentWell = new ArrayList<>();

    private List<String> improvements = new ArrayList<>();

    private List<String> actionItems = new ArrayList<>();

    private String overallNotes;

    @Min(value = 1, message = "Team mood must be between 1 and 5")
    @Max(value = 5, message = "Team mood must be between 1 and 5")
    private Integer teamMood;
}
