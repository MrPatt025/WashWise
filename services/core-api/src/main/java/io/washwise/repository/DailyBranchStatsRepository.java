package io.washwise.repository;

import io.washwise.domain.stats.DailyBranchStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyBranchStatsRepository extends JpaRepository<DailyBranchStats, UUID> {

    Optional<DailyBranchStats> findByBranchIdAndDate(UUID branchId, LocalDate date);
}
