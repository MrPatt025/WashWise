package io.washwise.domain.machine;

/**
 * Machine status enumeration.
 */
public enum MachineStatus {
    /** Machine is available for booking */
    IDLE,

    /** Machine is reserved but not yet in use */
    RESERVED,

    /** Machine is currently running */
    RUNNING,

    /** Machine is under maintenance */
    MAINTENANCE,

    /** Machine is out of order */
    OUT_OF_ORDER,

    /** Machine has an error */
    ERROR,

    /** Machine is offline/not communicating */
    OFFLINE,

    /** Machine is disabled/inactive */
    DISABLED
}
