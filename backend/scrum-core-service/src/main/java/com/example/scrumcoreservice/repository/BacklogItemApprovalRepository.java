package com.example.scrumcoreservice.repository;

import com.example.scrumcoreservice.entity.BacklogItemApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BacklogItemApprovalRepository extends JpaRepository<BacklogItemApproval, BacklogItemApproval.BacklogItemApprovalId> {

    /**
     * Find all approvals for a specific backlog item in a sprint
     */
    List<BacklogItemApproval> findByBacklogItemIdAndSprintId(Long backlogItemId, Long sprintId);

    /**
     * Find all pending approvals for a specific developer
     */
    List<BacklogItemApproval> findByDeveloperIdAndStatus(Long developerId, BacklogItemApproval.ApprovalStatus status);

    /**
     * Find approval for specific developer, item, and sprint
     */
    Optional<BacklogItemApproval> findByBacklogItemIdAndSprintIdAndDeveloperId(
            Long backlogItemId, Long sprintId, Long developerId);


    /**
     * Check if all approvals for a backlog item in a sprint are approved
     */
    @Query("SELECT COUNT(a) = 0 FROM BacklogItemApproval a " +
           "WHERE a.backlogItemId = :backlogItemId " +
           "AND a.sprintId = :sprintId " +
           "AND a.status != 'APPROVED'")
    boolean areAllApprovalsApproved(@Param("backlogItemId") Long backlogItemId,
                                     @Param("sprintId") Long sprintId);

    /**
     * Check if any approval for a backlog item in a sprint is rejected
     */
    @Query("SELECT COUNT(a) > 0 FROM BacklogItemApproval a " +
           "WHERE a.backlogItemId = :backlogItemId " +
           "AND a.sprintId = :sprintId " +
           "AND a.status = 'REJECTED'")
    boolean hasAnyRejection(@Param("backlogItemId") Long backlogItemId,
                            @Param("sprintId") Long sprintId);

    /**
     * Delete all approvals for a specific backlog item in a sprint
     */
    void deleteByBacklogItemIdAndSprintId(Long backlogItemId, Long sprintId);

    /**
     * Find all approvals for a sprint
     */
    List<BacklogItemApproval> findBySprintId(Long sprintId);

    /**
     * Count pending approvals for a specific backlog item in a sprint
     */
    @Query("SELECT COUNT(a) FROM BacklogItemApproval a " +
           "WHERE a.backlogItemId = :backlogItemId " +
           "AND a.sprintId = :sprintId " +
           "AND a.status = 'PENDING'")
    long countPendingApprovals(@Param("backlogItemId") Long backlogItemId,
                               @Param("sprintId") Long sprintId);
}
