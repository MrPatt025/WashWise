package io.washwise.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * JWT authentication filter that validates tokens and sets up security context.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            String token = extractToken(request);
            
            if (StringUtils.hasText(token)) {
                UUID userId = jwtService.extractUserId(token);
                UUID tenantId = jwtService.extractTenantId(token);
                var role = jwtService.extractRole(token);
                
                // Create authentication token with tenant context
                var authentication = new UsernamePasswordAuthenticationToken(
                        new AuthenticatedUser(userId, tenantId, role),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role.name()))
                );
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // Add tenant ID to request attributes for easy access
                request.setAttribute("tenantId", tenantId);
                request.setAttribute("userId", userId);
            }
        } catch (JwtException e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            // Don't set authentication - let Spring Security handle unauthorized
        }
        
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/auth/") || 
               path.startsWith("/actuator/") ||
               path.startsWith("/docs/") ||
               path.equals("/health");
    }
}
