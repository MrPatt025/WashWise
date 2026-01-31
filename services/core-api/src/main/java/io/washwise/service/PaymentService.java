package io.washwise.service;

import io.washwise.domain.booking.Booking;
import io.washwise.domain.booking.BookingStatus;
import io.washwise.domain.booking.PaymentStatus;
import io.washwise.domain.payment.Payment;
import io.washwise.domain.payment.PaymentMethod;
import io.washwise.domain.payment.PaymentWebhookEvent;
import io.washwise.domain.user.User;
import io.washwise.dto.payment.*;
import io.washwise.exception.BusinessException;
import io.washwise.exception.ConflictException;
import io.washwise.exception.NotFoundException;
import io.washwise.repository.BookingRepository;
import io.washwise.repository.PaymentRepository;
import io.washwise.repository.PaymentWebhookEventRepository;
import io.washwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Service for payment processing with idempotency and webhook support.
 * Supports multiple payment providers (PromptPay, LINE Pay, etc.)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentWebhookEventRepository webhookEventRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Initiate a payment with idempotency key support.
     * If a payment with the same idempotency key exists, return that payment.
     */
    @Transactional
    public PaymentResponse initiatePayment(UUID tenantId, UUID userId, InitiatePaymentRequest request) {
        log.info("Initiating payment for booking {} with idempotency key {}",
                request.getBookingId(), request.getIdempotencyKey());

        // 1. Check for existing payment with same idempotency key
        Optional<Payment> existingPayment = paymentRepository
                .findByIdempotencyKey(request.getIdempotencyKey());

        if (existingPayment.isPresent()) {
            log.info("Found existing payment with idempotency key {}", request.getIdempotencyKey());
            return mapToResponse(existingPayment.get());
        }

        // 2. Validate booking
        Booking booking = bookingRepository.findByIdAndTenantId(request.getBookingId(), tenantId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BusinessException("Only pending bookings can be paid");
        }

        if (booking.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new BusinessException("Payment already processed for this booking");
        }

        // 3. Validate user
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // 4. Create payment record
        Payment payment = Payment.builder()
                .tenant(booking.getTenant())
                .user(user)
                .booking(booking)
                .idempotencyKey(request.getIdempotencyKey())
                .amount(booking.getAmount().intValue())
                .currency("THB")
                .method(mapPaymentMethod(request.getMethod()))
                .status(io.washwise.domain.payment.PaymentStatus.PENDING)
                .receiptNumber(generateReceiptNumber())
                .metadata(Map.of(
                        "booking_number", booking.getBookingNumber(),
                        "machine_id", booking.getMachine().getId().toString()))
                .build();

        // 5. Integrate with payment provider (stub for now)
        PaymentProviderResponse providerResponse = callPaymentProvider(payment, request);

        payment.setProvider(request.getProvider() != null ? request.getProvider() : "internal");
        payment.setProviderPaymentId(providerResponse.getProviderPaymentId());
        payment.setProviderData(providerResponse.getProviderData());
        payment.setStatus(io.washwise.domain.payment.PaymentStatus.PROCESSING);

        Payment saved = paymentRepository.save(payment);
        log.info("Payment {} initiated successfully", saved.getId());

        return mapToResponse(saved, providerResponse);
    }

    /**
     * Process webhook event from payment provider.
     */
    @Transactional
    public void processWebhook(String provider, String eventId, String eventType, Map<String, Object> payload) {
        log.info("Processing webhook: provider={}, eventId={}, type={}", provider, eventId, eventType);

        // 1. Check for duplicate event processing (idempotency)
        Optional<PaymentWebhookEvent> existingEvent = webhookEventRepository.findByEventId(eventId);
        if (existingEvent.isPresent() && existingEvent.get().getProcessedAt() != null) {
            log.info("Webhook event {} already processed, skipping", eventId);
            return;
        }

        // 2. Extract provider payment ID from payload
        String providerPaymentId = extractProviderPaymentId(provider, payload);

        // 3. Find the payment
        Payment payment = paymentRepository.findByProviderAndProviderPaymentId(provider, providerPaymentId)
                .orElseThrow(() -> new NotFoundException("Payment not found for webhook"));

        // 4. Create or update webhook event record
        PaymentWebhookEvent webhookEvent = existingEvent.orElseGet(() -> PaymentWebhookEvent.builder()
                .payment(payment)
                .eventType(eventType)
                .eventId(eventId)
                .payload(payload)
                .build());

        try {
            // 5. Process based on event type
            switch (eventType.toLowerCase()) {
                case "charge.complete", "payment.success", "payment_intent.succeeded" -> {
                    handlePaymentSuccess(payment);
                }
                case "charge.failed", "payment.failed", "payment_intent.payment_failed" -> {
                    String failureCode = extractFailureCode(provider, payload);
                    String failureMessage = extractFailureMessage(provider, payload);
                    handlePaymentFailure(payment, failureCode, failureMessage);
                }
                case "refund.success", "charge.refund" -> {
                    Integer refundAmount = extractRefundAmount(provider, payload);
                    handleRefund(payment, refundAmount);
                }
                default -> {
                    log.warn("Unhandled webhook event type: {}", eventType);
                }
            }

            webhookEvent.setProcessedAt(Instant.now());
        } catch (Exception e) {
            log.error("Failed to process webhook event {}", eventId, e);
            webhookEvent.setProcessingError(e.getMessage());
        }

        webhookEventRepository.save(webhookEvent);
    }

    /**
     * Confirm payment manually (for cash payments or manual verification).
     */
    @Transactional
    public PaymentResponse confirmPayment(UUID tenantId, UUID paymentId) {
        Payment payment = paymentRepository.findByIdAndTenantId(paymentId, tenantId)
                .orElseThrow(() -> new NotFoundException("Payment not found"));

        if (payment.getStatus() != io.washwise.domain.payment.PaymentStatus.PENDING &&
                payment.getStatus() != io.washwise.domain.payment.PaymentStatus.PROCESSING) {
            throw new BusinessException("Payment cannot be confirmed in current status");
        }

        handlePaymentSuccess(payment);

        return mapToResponse(paymentRepository.findById(paymentId).orElseThrow());
    }

    /**
     * Request a refund.
     */
    @Transactional
    public PaymentResponse requestRefund(UUID tenantId, UUID paymentId, RefundRequest request) {
        Payment payment = paymentRepository.findByIdAndTenantId(paymentId, tenantId)
                .orElseThrow(() -> new NotFoundException("Payment not found"));

        if (payment.getStatus() != io.washwise.domain.payment.PaymentStatus.COMPLETED) {
            throw new BusinessException("Only completed payments can be refunded");
        }

        // Validate refund amount
        Integer maxRefundable = payment.getAmount()
                - (payment.getRefundAmount() != null ? payment.getRefundAmount() : 0);
        Integer refundAmount = request.getAmount() != null ? request.getAmount() : maxRefundable;

        if (refundAmount > maxRefundable) {
            throw new BusinessException("Refund amount exceeds refundable amount");
        }

        // Call payment provider for refund (stub)
        // In production, this would call the actual payment provider

        handleRefund(payment, refundAmount);
        payment.setRefundReason(request.getReason());

        Payment saved = paymentRepository.save(payment);
        log.info("Refund processed for payment {}: amount={}", paymentId, refundAmount);

        return mapToResponse(saved);
    }

    /**
     * Get payment by ID.
     */
    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID tenantId, UUID paymentId) {
        Payment payment = paymentRepository.findByIdAndTenantId(paymentId, tenantId)
                .orElseThrow(() -> new NotFoundException("Payment not found"));
        return mapToResponse(payment);
    }

    /**
     * Get payments for a tenant with pagination.
     */
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getPayments(UUID tenantId, Pageable pageable) {
        return paymentRepository.findAllByTenantId(tenantId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Get payment by booking ID.
     */
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByBooking(UUID tenantId, UUID bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new NotFoundException("Payment not found for booking"));

        if (!payment.getTenant().getId().equals(tenantId)) {
            throw new NotFoundException("Payment not found for booking");
        }

        return mapToResponse(payment);
    }

    // ==================== Private Helper Methods ====================

    private void handlePaymentSuccess(Payment payment) {
        payment.setStatus(io.washwise.domain.payment.PaymentStatus.COMPLETED);
        payment.setConfirmedAt(Instant.now());
        paymentRepository.save(payment);

        // Update booking status
        Booking booking = payment.getBooking();
        if (booking != null) {
            booking.setPaymentStatus(PaymentStatus.PAID);
            booking.setPaymentReference(payment.getId().toString());
            booking.setPaidAt(Instant.now());
            booking.setStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);
        }

        // Send notification
        try {
            notificationService.sendPaymentSuccessNotification(payment);
        } catch (Exception e) {
            log.error("Failed to send payment success notification", e);
        }

        log.info("Payment {} completed successfully", payment.getId());
    }

    private void handlePaymentFailure(Payment payment, String failureCode, String failureMessage) {
        payment.setStatus(io.washwise.domain.payment.PaymentStatus.FAILED);
        payment.setFailedAt(Instant.now());
        payment.setFailureCode(failureCode);
        payment.setFailureMessage(failureMessage);
        paymentRepository.save(payment);

        // Update booking
        Booking booking = payment.getBooking();
        if (booking != null) {
            booking.setPaymentStatus(PaymentStatus.FAILED);
            bookingRepository.save(booking);
        }

        // Send notification
        try {
            notificationService.sendPaymentFailedNotification(payment);
        } catch (Exception e) {
            log.error("Failed to send payment failure notification", e);
        }

        log.info("Payment {} failed: {} - {}", payment.getId(), failureCode, failureMessage);
    }

    private void handleRefund(Payment payment, Integer refundAmount) {
        Integer currentRefund = payment.getRefundAmount() != null ? payment.getRefundAmount() : 0;
        Integer newRefundTotal = currentRefund + refundAmount;

        payment.setRefundAmount(newRefundTotal);
        payment.setRefundedAt(Instant.now());

        if (newRefundTotal.equals(payment.getAmount())) {
            payment.setStatus(io.washwise.domain.payment.PaymentStatus.REFUNDED);
        } else {
            payment.setStatus(io.washwise.domain.payment.PaymentStatus.PARTIALLY_REFUNDED);
        }

        paymentRepository.save(payment);
        log.info("Payment {} refunded: amount={}, total_refunded={}",
                payment.getId(), refundAmount, newRefundTotal);
    }

    private PaymentProviderResponse callPaymentProvider(Payment payment, InitiatePaymentRequest request) {
        // Stub implementation - in production, this would call the actual payment
        // provider
        // (Stripe, Omise, PromptPay, etc.)

        String providerPaymentId = "PAY_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        return PaymentProviderResponse.builder()
                .providerPaymentId(providerPaymentId)
                .providerData(Map.of(
                        "status", "pending",
                        "created_at", Instant.now().toString()))
                .qrCodeUrl(request.getMethod() == PaymentMethodType.PROMPTPAY
                        ? "https://api.example.com/qr/" + providerPaymentId
                        : null)
                .redirectUrl(request.getMethod() == PaymentMethodType.LINE_PAY
                        ? "https://pay.line.me/checkout/" + providerPaymentId
                        : null)
                .build();
    }

    private String extractProviderPaymentId(String provider, Map<String, Object> payload) {
        // Extract based on provider format
        return switch (provider.toLowerCase()) {
            case "stripe" -> (String) payload.getOrDefault("payment_intent",
                    ((Map<?, ?>) payload.getOrDefault("data", Map.of())).get("id"));
            case "omise" -> (String) payload.get("id");
            default -> (String) payload.get("payment_id");
        };
    }

    private String extractFailureCode(String provider, Map<String, Object> payload) {
        return (String) payload.getOrDefault("failure_code", "unknown");
    }

    private String extractFailureMessage(String provider, Map<String, Object> payload) {
        return (String) payload.getOrDefault("failure_message", "Payment failed");
    }

    private Integer extractRefundAmount(String provider, Map<String, Object> payload) {
        Object amount = payload.get("amount");
        if (amount instanceof Number) {
            return ((Number) amount).intValue();
        }
        return null;
    }

    private PaymentMethod mapPaymentMethod(PaymentMethodType type) {
        if (type == null)
            return PaymentMethod.CASH;
        return switch (type) {
            case CASH -> PaymentMethod.CASH;
            case CREDIT_CARD -> PaymentMethod.CREDIT_CARD;
            case DEBIT_CARD -> PaymentMethod.DEBIT_CARD;
            case PROMPTPAY -> PaymentMethod.PROMPTPAY;
            case BANK_TRANSFER -> PaymentMethod.BANK_TRANSFER;
            case LINE_PAY -> PaymentMethod.LINE_PAY;
            case TRUE_MONEY -> PaymentMethod.TRUE_MONEY;
            case WALLET -> PaymentMethod.WALLET;
        };
    }

    private String generateReceiptNumber() {
        String dateStr = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now());
        int random = ThreadLocalRandom.current().nextInt(10000, 99999);
        return "RCP-" + dateStr + "-" + random;
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return mapToResponse(payment, null);
    }

    private PaymentResponse mapToResponse(Payment payment, PaymentProviderResponse providerResponse) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .idempotencyKey(payment.getIdempotencyKey())
                .bookingId(payment.getBooking() != null ? payment.getBooking().getId() : null)
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .method(payment.getMethod().name())
                .status(payment.getStatus().name())
                .provider(payment.getProvider())
                .providerPaymentId(payment.getProviderPaymentId())
                .receiptNumber(payment.getReceiptNumber())
                .confirmedAt(payment.getConfirmedAt())
                .failedAt(payment.getFailedAt())
                .failureCode(payment.getFailureCode())
                .failureMessage(payment.getFailureMessage())
                .refundAmount(payment.getRefundAmount())
                .refundedAt(payment.getRefundedAt())
                .qrCodeUrl(providerResponse != null ? providerResponse.getQrCodeUrl() : null)
                .redirectUrl(providerResponse != null ? providerResponse.getRedirectUrl() : null)
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
