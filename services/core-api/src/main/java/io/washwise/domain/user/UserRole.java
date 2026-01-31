package io.washwise.domain.user;

/**
 * User role enumeration for role-based access control.
 */
public enum UserRole {
    /** Platform super administrator */
    SUPER_ADMIN,

    /** Tenant owner with full tenant access */
    OWNER,

    /** Branch manager with management access */
    MANAGER,

    /** Branch staff with limited access */
    STAFF,

    /** Customer using the laundromat services */
    CUSTOMER
}
