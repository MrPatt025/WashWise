package io.washwise.domain.audit;

/**
 * Types of audit actions.
 */
public enum AuditAction {
    CREATE,
    READ,
    UPDATE,
    DELETE,
    LOGIN,
    LOGOUT,
    PASSWORD_CHANGE,
    ROLE_CHANGE,
    PAYMENT,
    BOOKING,
    MACHINE_STATUS_CHANGE,
    SETTINGS_CHANGE
}
