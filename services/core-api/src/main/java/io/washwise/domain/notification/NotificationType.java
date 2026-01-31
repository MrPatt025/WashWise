package io.washwise.domain.notification;

/**
 * Types of notifications.
 */
public enum NotificationType {
    BOOKING_CONFIRMED,
    BOOKING_REMINDER,
    BOOKING_CANCELLED,
    CYCLE_STARTED,
    CYCLE_COMPLETED,
    CYCLE_ALMOST_DONE,
    PAYMENT_SUCCESS,
    PAYMENT_FAILED,
    MACHINE_ERROR,
    PROMOTION,
    SYSTEM
}
