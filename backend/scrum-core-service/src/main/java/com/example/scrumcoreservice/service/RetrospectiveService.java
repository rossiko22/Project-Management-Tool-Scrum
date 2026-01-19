package com.example.scrumcoreservice.service;

import com.example.scrumcoreservice.dto.CreateRetrospectiveRequest;
import com.example.scrumcoreservice.dto.RetrospectiveDto;
import com.example.scrumcoreservice.entity.Sprint;
import com.example.scrumcoreservice.entity.SprintRetrospective;
import com.example.scrumcoreservice.repository.SprintRepository;
import com.example.scrumcoreservice.repository.SprintRetrospectiveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RetrospectiveService {

    private final SprintRetrospectiveRepository retrospectiveRepository;
    private final SprintRepository sprintRepository;

    @Transactional
    public RetrospectiveDto createRetrospective(CreateRetrospectiveRequest request, Long facilitatorId) {
        // Verify sprint exists and is completed or active (can have retro during or after)
        Sprint sprint = sprintRepository.findById(request.getSprintId())
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        if (sprint.getStatus() != Sprint.SprintStatus.COMPLETED &&
            sprint.getStatus() != Sprint.SprintStatus.ACTIVE) {
            throw new RuntimeException("Retrospective can only be held for active or completed sprints");
        }

        // Check if retrospective already exists for this sprint
        if (retrospectiveRepository.findBySprintId(request.getSprintId()).isPresent()) {
            throw new RuntimeException("Retrospective already exists for this sprint. Use update instead.");
        }

        SprintRetrospective retrospective = SprintRetrospective.builder()
                .sprintId(request.getSprintId())
                .facilitatedBy(facilitatorId)
                .wentWell(request.getWentWell())
                .improvements(request.getImprovements())
                .actionItems(request.getActionItems())
                .overallNotes(request.getOverallNotes())
                .teamMood(request.getTeamMood())
                .build();

        retrospective = retrospectiveRepository.save(retrospective);

        return RetrospectiveDto.fromEntity(retrospective);
    }

    @Transactional
    public RetrospectiveDto updateRetrospective(Long id, CreateRetrospectiveRequest request) {
        SprintRetrospective retrospective = retrospectiveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Retrospective not found"));

        retrospective.setWentWell(request.getWentWell());
        retrospective.setImprovements(request.getImprovements());
        retrospective.setActionItems(request.getActionItems());
        retrospective.setOverallNotes(request.getOverallNotes());
        retrospective.setTeamMood(request.getTeamMood());

        retrospective = retrospectiveRepository.save(retrospective);

        return RetrospectiveDto.fromEntity(retrospective);
    }

    public RetrospectiveDto getRetrospectiveBySprintId(Long sprintId) {
        return retrospectiveRepository.findBySprintId(sprintId)
                .map(RetrospectiveDto::fromEntity)
                .orElse(null);
    }

    public RetrospectiveDto getRetrospective(Long id) {
        return retrospectiveRepository.findById(id)
                .map(RetrospectiveDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Retrospective not found"));
    }
}
