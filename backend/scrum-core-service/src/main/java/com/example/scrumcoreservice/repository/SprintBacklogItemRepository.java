package com.example.scrumcoreservice.repository;

import com.example.scrumcoreservice.entity.SprintBacklogItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SprintBacklogItemRepository extends JpaRepository<SprintBacklogItem, SprintBacklogItem.SprintBacklogItemId> {

    List<SprintBacklogItem> findBySprintId(Long sprintId);

    void deleteBySprintIdAndBacklogItemId(Long sprintId, Long backlogItemId);
}
