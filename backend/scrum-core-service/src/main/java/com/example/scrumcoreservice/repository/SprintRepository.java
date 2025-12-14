package com.example.scrumcoreservice.repository;

import com.example.scrumcoreservice.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {

    List<Sprint> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<Sprint> findByProjectIdAndStatus(Long projectId, Sprint.SprintStatus status);

    Optional<Sprint> findFirstByProjectIdAndStatusOrderByStartedAtDesc(Long projectId, Sprint.SprintStatus status);
}
