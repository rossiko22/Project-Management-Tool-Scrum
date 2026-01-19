package com.example.scrumcoreservice.service;

import com.example.scrumcoreservice.dto.ImpedimentDto;
import com.example.scrumcoreservice.entity.Impediment;
import com.example.scrumcoreservice.entity.Sprint;
import com.example.scrumcoreservice.events.ImpedimentEvent;
import com.example.scrumcoreservice.repository.ImpedimentRepository;
import com.example.scrumcoreservice.repository.SprintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImpedimentService {

    private final ImpedimentRepository impedimentRepository;
    private final SprintRepository sprintRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public ImpedimentDto createImpediment(Long sprintId, String title, String description, Long reportedBy) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new RuntimeException("Sprint not found"));

        Impediment impediment = Impediment.builder()
                .sprint(sprint)
                .title(title)
                .description(description)
                .status(Impediment.ImpedimentStatus.OPEN)
                .reportedBy(reportedBy)
                .build();

        impediment = impedimentRepository.save(impediment);

        // Publish event for notifications
        eventPublisher.publishImpedimentEvent(ImpedimentEvent.builder()
                .impedimentId(impediment.getId())
                .sprintId(sprintId)
                .projectId(sprint.getProjectId())
                .title(title)
                .description(description)
                .status("OPEN")
                .reportedBy(reportedBy)
                .action("CREATED")
                .timestamp(Instant.now())
                .performedBy(reportedBy)
                .build());

        return ImpedimentDto.fromEntity(impediment);
    }

    public List<ImpedimentDto> getSprintImpediments(Long sprintId) {
        return impedimentRepository.findBySprintId(sprintId)
                .stream()
                .map(ImpedimentDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ImpedimentDto> getOpenImpediments(Long sprintId) {
        return impedimentRepository.findBySprintIdAndStatus(sprintId, Impediment.ImpedimentStatus.OPEN)
                .stream()
                .map(ImpedimentDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ImpedimentDto getImpediment(Long id) {
        Impediment impediment = impedimentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Impediment not found"));
        return ImpedimentDto.fromEntity(impediment);
    }

    @Transactional
    public ImpedimentDto updateImpedimentStatus(Long id, Impediment.ImpedimentStatus status) {
        Impediment impediment = impedimentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Impediment not found"));

        impediment.setStatus(status);
        impediment = impedimentRepository.save(impediment);
        return ImpedimentDto.fromEntity(impediment);
    }

    @Transactional
    public ImpedimentDto assignImpediment(Long id, Long assignedTo) {
        Impediment impediment = impedimentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Impediment not found"));

        impediment.setAssignedTo(assignedTo);
        if (impediment.getStatus() == Impediment.ImpedimentStatus.OPEN) {
            impediment.setStatus(Impediment.ImpedimentStatus.IN_PROGRESS);
        }
        impediment = impedimentRepository.save(impediment);
        return ImpedimentDto.fromEntity(impediment);
    }

    @Transactional
    public ImpedimentDto resolveImpediment(Long id, Long resolvedBy, String resolution) {
        Impediment impediment = impedimentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Impediment not found"));

        impediment.setStatus(Impediment.ImpedimentStatus.RESOLVED);
        impediment.setResolvedBy(resolvedBy);
        impediment.setResolvedAt(LocalDateTime.now());
        impediment.setResolution(resolution);

        impediment = impedimentRepository.save(impediment);

        // Publish event for notifications
        eventPublisher.publishImpedimentEvent(ImpedimentEvent.builder()
                .impedimentId(impediment.getId())
                .sprintId(impediment.getSprint().getId())
                .projectId(impediment.getSprint().getProjectId())
                .title(impediment.getTitle())
                .status("RESOLVED")
                .reportedBy(impediment.getReportedBy())
                .resolvedBy(resolvedBy)
                .resolution(resolution)
                .action("RESOLVED")
                .timestamp(Instant.now())
                .performedBy(resolvedBy)
                .build());

        return ImpedimentDto.fromEntity(impediment);
    }

    @Transactional
    public void deleteImpediment(Long id) {
        impedimentRepository.deleteById(id);
    }
}
