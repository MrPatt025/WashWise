package io.washwise.security;

import io.washwise.domain.user.User;
import io.washwise.domain.user.UserRole;
import io.washwise.domain.user.UserStatus;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Custom UserDetails implementation with tenant context.
 */
@Getter
public class TenantUserDetails implements UserDetails {
    
    private final UUID userId;
    private final UUID tenantId;
    private final String email;
    private final String password;
    private final UserRole role;
    private final UserStatus status;
    private final Collection<? extends GrantedAuthority> authorities;

    public TenantUserDetails(User user) {
        this.userId = user.getId();
        this.tenantId = user.getTenant().getId();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.role = user.getRole();
        this.status = user.getStatus();
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return status != UserStatus.SUSPENDED;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != UserStatus.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }
}
