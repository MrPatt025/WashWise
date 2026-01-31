package io.washwise.domain.booking;

/**
 * Payment status enumeration for bookings.
 */
public enum PaymentStatus {
    /** Payment not yet initiated */
    PENDING,
    
    /** Payment is being processed */
    PROCESSING,
    
    /** Payment completed successfully */
    PAID,
    
    /** Payment failed */
    FAILED,
    
    /** Payment refunded */
    REFUNDED,
    
    /** Partial refund issued */
    PARTIALLY_REFUNDED
}
