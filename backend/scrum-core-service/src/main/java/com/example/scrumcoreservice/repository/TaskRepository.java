package com.example.scrumcoreservice.repository;

import com.example.scrumcoreservice.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByBacklogItemId(Long backlogItemId);

    List<Task> findByAssigneeId(Long assigneeId);

    List<Task> findByStatus(Task.TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.backlogItem.id IN " +
           "(SELECT sbi.backlogItemId FROM SprintBacklogItem sbi WHERE sbi.sprintId = :sprintId)")
    List<Task> findBySprintId(Long sprintId);
}
