package com.example.scrumcoreservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SprintBoardDto {

    private Long sprintId;
    private String sprintName;
    private String sprintStatus;

    // Items grouped by board column
    private BoardColumnsDto columns;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BoardColumnsDto {
        private List<BacklogItemDto> toDo;
        private List<BacklogItemDto> inProgress;
        private List<BacklogItemDto> review;
        private List<BacklogItemDto> done;
    }
}
