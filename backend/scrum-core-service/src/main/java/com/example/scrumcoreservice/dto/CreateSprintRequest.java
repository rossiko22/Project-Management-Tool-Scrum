package com.example.scrumcoreservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateSprintRequest {
    @NotNull(message = "Project ID is required")
    private Long projectId;

    private Long teamId;

    @NotBlank(message = "Sprint name is required")
    private String name;

    private String goal;
    private LocalDate startDate;
    private LocalDate endDate;

    @NotNull(message = "Length in weeks is required")
    private Integer lengthWeeks;

    private Integer teamCapacity;
}
