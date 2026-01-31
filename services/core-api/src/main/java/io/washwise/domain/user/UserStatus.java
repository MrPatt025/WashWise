package io.washwise.domain.user;

/**
 * User account status enumeration.
 */
public enum UserStatus {
    /** Active user account */
    ACTIVE,
    
    /** Inactive/disabled account */
    INACTIVE,
    
    /** Account suspended by admin */
    SUSPENDED,
    
    /** Account pending verification */
    PENDING_VERIFICATION
}
