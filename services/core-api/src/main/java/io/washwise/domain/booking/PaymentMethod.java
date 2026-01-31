package io.washwise.domain.booking;

/**
 * Payment method enumeration.
 */
public enum PaymentMethod {
    /** Cash payment */
    CASH,

    /** Credit card payment */
    CREDIT_CARD,

    /** Debit card payment */
    DEBIT_CARD,

    /** Thai PromptPay QR payment */
    PROMPTPAY,

    /** Digital wallet */
    WALLET,

    /** LINE Pay */
    LINE_PAY,

    /** TrueMoney Wallet */
    TRUE_MONEY
}
