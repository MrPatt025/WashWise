package io.washwise.repository;

import io.washwise.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.tenant.id = :tenantId")
    Optional<User> findByEmailAndTenantId(@Param("email") String email, @Param("tenantId") UUID tenantId);
    
    @Query("SELECT u FROM User u JOIN FETCH u.tenant WHERE u.email = :email")
    List<User> findByEmailWithTenant(@Param("email") String email);
    
    @Query("SELECT u FROM User u WHERE u.tenant.id = :tenantId")
    List<User> findAllByTenantId(@Param("tenantId") UUID tenantId);
    
    @Query("SELECT u FROM User u WHERE u.id = :id AND u.tenant.id = :tenantId")
    Optional<User> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);
    
    boolean existsByEmailAndTenantId(String email, UUID tenantId);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.tenant.id = :tenantId AND u.role = :role")
    long countByTenantIdAndRole(@Param("tenantId") UUID tenantId, @Param("role") User.UserRole role);
}
