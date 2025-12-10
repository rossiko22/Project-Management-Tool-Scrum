package com.example.identityservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignTeamRequest {
    private Long productOwnerId;
    private Long scrumMasterId;
    private List<Long> developerIds;
}
