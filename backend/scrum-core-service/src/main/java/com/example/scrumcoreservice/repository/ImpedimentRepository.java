package com.example.scrumcoreservice.repository;

import com.example.scrumcoreservice.entity.Impediment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImpedimentRepository extends JpaRepository<Impediment, Long> {

    List<Impediment> findBySprintId(Long sprintId);

    List<Impediment> findBySprintIdAndStatus(Long sprintId, Impediment.ImpedimentStatus status);

    List<Impediment> findByAssignedTo(Long assignedTo);
}
