package com.example.scrumcoreservice.repository;

import com.example.scrumcoreservice.entity.ProductBacklogItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductBacklogItemRepository extends JpaRepository<ProductBacklogItem, Long> {

    List<ProductBacklogItem> findByProjectIdOrderByPositionAsc(Long projectId);

    List<ProductBacklogItem> findByProjectIdAndStatus(Long projectId, ProductBacklogItem.ItemStatus status);

    @Query("SELECT MAX(p.position) FROM ProductBacklogItem p WHERE p.projectId = :projectId")
    Integer findMaxPositionByProjectId(Long projectId);

    List<ProductBacklogItem> findByProjectIdAndType(Long projectId, ProductBacklogItem.ItemType type);
}
