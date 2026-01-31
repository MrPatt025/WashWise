package io.washwise.repository;

import io.washwise.domain.machine.Machine;
import io.washwise.domain.machine.MachineStatus;
import io.washwise.domain.machine.MachineType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MachineRepository extends JpaRepository<Machine, UUID> {

    @Query("SELECT m FROM Machine m WHERE m.tenant.id = :tenantId")
    Page<Machine> findAllByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);
    
    @Query("SELECT m FROM Machine m WHERE m.tenant.id = :tenantId")
    List<Machine> findAllByTenantId(@Param("tenantId") UUID tenantId);
    
    @Query("SELECT m FROM Machine m WHERE m.id = :id AND m.tenant.id = :tenantId")
    Optional<Machine> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
    
    @Query("SELECT m FROM Machine m WHERE m.tenant.id = :tenantId AND m.status = :status")
    List<Machine> findByTenantIdAndStatus(@Param("tenantId") UUID tenantId, @Param("status") MachineStatus status);
    
    @Query("SELECT m FROM Machine m WHERE m.tenant.id = :tenantId AND m.branchId = :branchId")
    List<Machine> findByTenantIdAndBranchId(@Param("tenantId") UUID tenantId, @Param("branchId") UUID branchId);
    
    @Query("SELECT m FROM Machine m WHERE m.tenant.id = :tenantId AND m.type = :type AND m.status = :status")
    List<Machine> findAvailableByType(@Param("tenantId") UUID tenantId, @Param("type") MachineType type, @Param("status") MachineStatus status);
    
    @Query("SELECT COUNT(m) FROM Machine m WHERE m.tenant.id = :tenantId")
    long countByTenantId(@Param("tenantId") UUID tenantId);
    
    @Query("SELECT COUNT(m) FROM Machine m WHERE m.tenant.id = :tenantId AND m.status = :status")
    long countByTenantIdAndStatus(@Param("tenantId") UUID tenantId, @Param("status") MachineStatus status);
    
    boolean existsByIotDeviceId(String iotDeviceId);

    @Query("SELECT m.status as status, COUNT(m) as count FROM Machine m WHERE m.tenant.id = :tenantId GROUP BY m.status")
    List<Object[]> countByTenantIdGroupByStatusRaw(@Param("tenantId") UUID tenantId);

    default Map<String, Long> countByTenantIdGroupByStatus(UUID tenantId) {
        List<Object[]> results = countByTenantIdGroupByStatusRaw(tenantId);
        return results.stream()
            .collect(java.util.stream.Collectors.toMap(
                row -> ((MachineStatus) row[0]).name(),
                row -> (Long) row[1]
            ));
    }
}
