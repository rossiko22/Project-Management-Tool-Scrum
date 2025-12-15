package com.example.scrumcoreservice.repository;

import com.example.scrumcoreservice.entity.SprintRetrospective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SprintRetrospectiveRepository extends JpaRepository<SprintRetrospective, Long> {

    Optional<SprintRetrospective> findBySprintId(Long sprintId);
}
