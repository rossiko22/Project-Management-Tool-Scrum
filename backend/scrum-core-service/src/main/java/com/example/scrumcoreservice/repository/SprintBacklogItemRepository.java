package com.example.scrumcoreservice.repository;

import com.example.scrumcoreservice.entity.SprintBacklogItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintBacklogItemRepository extends JpaRepository<SprintBacklogItem, SprintBacklogItem.SprintBacklogItemId> {

    List<SprintBacklogItem> findBySprintId(Long sprintId);

    void deleteBySprintIdAndBacklogItemId(Long sprintId, Long backlogItemId);

    @Query("SELECT sbi.sprintId FROM SprintBacklogItem sbi WHERE sbi.backlogItemId = :backlogItemId")
    Optional<Long> findSprintIdByBacklogItemId(Long backlogItemId);
}
