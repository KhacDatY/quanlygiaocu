package com.example.quanly_giaocu.repository;

import com.example.quanly_giaocu.entity.Proposal;
import com.example.quanly_giaocu.enums.ProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long>, JpaSpecificationExecutor<Proposal> {
    List<Proposal> findByCreatorId(UUID creatorId);

    @Query("SELECT COALESCE(SUM(p.estimatedTotal), 0.0) FROM Proposal p " +
            "WHERE p.status = :status AND p.createdAt BETWEEN :startDate AND :endDate")
    Double sumTotalByStatusAndDateRange(
            @Param("status") ProposalStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    Optional<Proposal> findFirstByCodeStartingWithOrderByCodeDesc(String prefix);
}