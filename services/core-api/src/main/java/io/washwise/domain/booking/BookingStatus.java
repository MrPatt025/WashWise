package io.washwise.domain.booking;

/**
 * Booking status enumeration for machine reservations.
 */
public enum BookingStatus {
    /** Booking created but not yet confirmed */
    PENDING,

    /** Booking confirmed and ready for use */
    CONFIRMED,

    /** Customer has checked in */
    CHECKED_IN,

    /** Customer is currently using the machine */
    IN_PROGRESS,

    /** Booking completed successfully */
    COMPLETED,

    /** Booking cancelled by user or system */
    CANCELLED,

    /** Customer did not show up for booking */
    NO_SHOW,

    /** Booking expired (not paid in time) */
    EXPIRED
}
