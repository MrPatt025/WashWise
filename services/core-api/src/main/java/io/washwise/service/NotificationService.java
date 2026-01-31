package io.washwise.service;

import io.washwise.domain.booking.Booking;
import io.washwise.domain.notification.*;
import io.washwise.domain.payment.Payment;
import io.washwise.domain.user.User;
import io.washwise.dto.notification.*;
import io.washwise.exception.NotFoundException;
import io.washwise.repository.NotificationConfigRepository;
import io.washwise.repository.NotificationRepository;
import io.washwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service for managing notifications across multiple channels.
 * Supports LINE, Email, Push, SMS, and In-App notifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationConfigRepository configRepository;
    private final UserRepository userRepository;

    // ==================== Public API ====================

    /**
     * Send a notification to a user.
     */
    @Transactional
    public NotificationResponse sendNotification(UUID tenantId, SendNotificationRequest request) {
        User user = userRepository.findByIdAndTenantId(request.getUserId(), tenantId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        
        Notification notification = createNotification(
            user,
            request.getType(),
            request.getTitle(),
            request.getBody(),
            request.getData(),
            request.getChannels(),
            request.getPriority()
        );
        
        Notification saved = notificationRepository.save(notification);
        
        // Dispatch to channels asynchronously
        dispatchNotification(saved);
        
        return mapToResponse(saved);
    }

    /**
     * Get notifications for a user.
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
            .map(this::mapToResponse);
    }

    /**
     * Get unread notifications for a user.
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUnreadNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findUnreadByUserId(userId, pageable)
            .map(this::mapToResponse);
    }

    /**
     * Get unread notification count for a user.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    /**
     * Mark a notification as read.
     */
    @Transactional
    public NotificationResponse markAsRead(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new NotFoundException("Notification not found"));
        
        notification.setReadAt(Instant.now());
        Notification saved = notificationRepository.save(notification);
        
        return mapToResponse(saved);
    }

    /**
     * Mark all notifications as read for a user.
     */
    @Transactional
    public int markAllAsRead(UUID userId) {
        return notificationRepository.markAllAsRead(userId, Instant.now());
    }

    /**
     * Delete a notification.
     */
    @Transactional
    public void deleteNotification(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new NotFoundException("Notification not found"));
        
        notificationRepository.delete(notification);
    }

    // ==================== Booking Notifications ====================

    @Async
    @Transactional
    public void sendBookingConfirmedNotification(Booking booking) {
        String title = "Booking Confirmed";
        String body = String.format(
            "Your booking %s has been confirmed for %s at %s",
            booking.getBookingNumber(),
            booking.getMachine().getName(),
            formatTime(booking.getStartTime())
        );
        
        Map<String, Object> data = Map.of(
            "booking_id", booking.getId().toString(),
            "booking_number", booking.getBookingNumber(),
            "machine_id", booking.getMachine().getId().toString()
        );
        
        createAndDispatch(
            booking.getUser(),
            NotificationType.BOOKING_CONFIRMED,
            title, body, data,
            List.of(NotificationChannel.IN_APP, NotificationChannel.LINE, NotificationChannel.PUSH)
        );
    }

    @Async
    @Transactional
    public void sendBookingReminderNotification(Booking booking) {
        String title = "Booking Reminder";
        String body = String.format(
            "Reminder: Your booking at %s starts at %s",
            booking.getMachine().getName(),
            formatTime(booking.getStartTime())
        );
        
        Map<String, Object> data = Map.of(
            "booking_id", booking.getId().toString(),
            "booking_number", booking.getBookingNumber()
        );
        
        createAndDispatch(
            booking.getUser(),
            NotificationType.BOOKING_REMINDER,
            title, body, data,
            List.of(NotificationChannel.IN_APP, NotificationChannel.LINE, NotificationChannel.PUSH)
        );
    }

    @Async
    @Transactional
    public void sendCycleCompletedNotification(Booking booking) {
        String title = "Cycle Completed";
        String body = String.format(
            "Your laundry at %s is done! Please collect your items.",
            booking.getMachine().getName()
        );
        
        Map<String, Object> data = Map.of(
            "booking_id", booking.getId().toString(),
            "machine_id", booking.getMachine().getId().toString()
        );
        
        createAndDispatch(
            booking.getUser(),
            NotificationType.CYCLE_COMPLETED,
            title, body, data,
            List.of(NotificationChannel.IN_APP, NotificationChannel.LINE, NotificationChannel.PUSH)
        );
    }

    @Async
    @Transactional
    public void sendCycleAlmostDoneNotification(Booking booking, int minutesRemaining) {
        String title = "Almost Done!";
        String body = String.format(
            "Your laundry at %s will be ready in %d minutes",
            booking.getMachine().getName(),
            minutesRemaining
        );
        
        Map<String, Object> data = Map.of(
            "booking_id", booking.getId().toString(),
            "minutes_remaining", minutesRemaining
        );
        
        createAndDispatch(
            booking.getUser(),
            NotificationType.CYCLE_ALMOST_DONE,
            title, body, data,
            List.of(NotificationChannel.PUSH)
        );
    }

    // ==================== Payment Notifications ====================

    @Async
    @Transactional
    public void sendPaymentSuccessNotification(Payment payment) {
        String title = "Payment Successful";
        String body = String.format(
            "Payment of ฿%.2f received. Receipt: %s",
            payment.getAmount() / 100.0,
            payment.getReceiptNumber()
        );
        
        Map<String, Object> data = Map.of(
            "payment_id", payment.getId().toString(),
            "receipt_number", payment.getReceiptNumber(),
            "amount", payment.getAmount()
        );
        
        createAndDispatch(
            payment.getUser(),
            NotificationType.PAYMENT_SUCCESS,
            title, body, data,
            List.of(NotificationChannel.IN_APP, NotificationChannel.LINE)
        );
    }

    @Async
    @Transactional
    public void sendPaymentFailedNotification(Payment payment) {
        String title = "Payment Failed";
        String body = String.format(
            "Payment of ฿%.2f failed. Please try again.",
            payment.getAmount() / 100.0
        );
        
        Map<String, Object> data = Map.of(
            "payment_id", payment.getId().toString(),
            "failure_code", payment.getFailureCode() != null ? payment.getFailureCode() : "unknown"
        );
        
        createAndDispatch(
            payment.getUser(),
            NotificationType.PAYMENT_FAILED,
            title, body, data,
            List.of(NotificationChannel.IN_APP, NotificationChannel.PUSH)
        );
    }

    // ==================== Machine Notifications ====================

    @Async
    @Transactional
    public void sendMachineErrorNotification(UUID tenantId, UUID machineId, String errorMessage) {
        // Notify all OWNER and STAFF users of the tenant
        List<User> staff = userRepository.findStaffByTenantId(tenantId);
        
        String title = "Machine Error";
        String body = String.format("Machine error detected: %s", errorMessage);
        
        Map<String, Object> data = Map.of(
            "machine_id", machineId.toString(),
            "error_message", errorMessage
        );
        
        for (User user : staff) {
            createAndDispatch(
                user,
                NotificationType.MACHINE_ERROR,
                title, body, data,
                List.of(NotificationChannel.IN_APP, NotificationChannel.LINE, NotificationChannel.EMAIL)
            );
        }
    }

    // ==================== Private Helper Methods ====================

    private void createAndDispatch(User user, NotificationType type, String title, String body,
                                   Map<String, Object> data, List<NotificationChannel> channels) {
        try {
            Notification notification = createNotification(user, type, title, body, data, channels, NotificationPriority.NORMAL);
            Notification saved = notificationRepository.save(notification);
            dispatchNotification(saved);
        } catch (Exception e) {
            log.error("Failed to create/dispatch notification for user {}", user.getId(), e);
        }
    }

    private Notification createNotification(User user, NotificationType type, String title, String body,
                                            Map<String, Object> data, List<NotificationChannel> channels,
                                            NotificationPriority priority) {
        return Notification.builder()
            .tenant(user.getTenant())
            .user(user)
            .type(type)
            .title(title)
            .body(body)
            .data(data != null ? data : Map.of())
            .channels(channels != null ? new HashSet<>(channels) : Set.of(NotificationChannel.IN_APP))
            .deliveryStatus(new HashMap<>())
            .priority(priority != null ? priority : NotificationPriority.NORMAL)
            .build();
    }

    @Async
    private void dispatchNotification(Notification notification) {
        Map<String, Object> deliveryStatus = new HashMap<>();
        
        for (NotificationChannel channel : notification.getChannels()) {
            try {
                boolean success = switch (channel) {
                    case IN_APP -> true; // Already stored in DB
                    case LINE -> sendToLine(notification);
                    case EMAIL -> sendToEmail(notification);
                    case PUSH -> sendToPush(notification);
                    case SMS -> sendToSms(notification);
                };
                
                deliveryStatus.put(channel.name(), Map.of(
                    "success", success,
                    "sent_at", Instant.now().toString()
                ));
            } catch (Exception e) {
                log.error("Failed to send notification via {}", channel, e);
                deliveryStatus.put(channel.name(), Map.of(
                    "success", false,
                    "error", e.getMessage()
                ));
            }
        }
        
        notification.setDeliveryStatus(deliveryStatus);
        notification.setSentAt(Instant.now());
        notificationRepository.save(notification);
    }

    private boolean sendToLine(Notification notification) {
        // Get LINE config for tenant
        Optional<NotificationConfig> config = configRepository.findByTenantId(notification.getTenant().getId());
        
        if (config.isEmpty() || config.get().getLineAccessToken() == null) {
            log.warn("LINE not configured for tenant {}", notification.getTenant().getId());
            return false;
        }
        
        String lineUserId = notification.getUser().getLineUserId();
        if (lineUserId == null) {
            log.warn("User {} has no LINE account linked", notification.getUser().getId());
            return false;
        }
        
        // TODO: Implement LINE Messaging API call
        // This would use WebClient to call LINE's push message API
        log.info("Sending LINE notification to user {} (LINE ID: {})", 
            notification.getUser().getId(), lineUserId);
        
        return true; // Stub
    }

    private boolean sendToEmail(Notification notification) {
        Optional<NotificationConfig> config = configRepository.findByTenantId(notification.getTenant().getId());
        
        if (config.isEmpty() || config.get().getSmtpHost() == null) {
            log.warn("Email not configured for tenant {}", notification.getTenant().getId());
            return false;
        }
        
        String email = notification.getUser().getEmail();
        if (email == null) {
            log.warn("User {} has no email", notification.getUser().getId());
            return false;
        }
        
        // TODO: Implement email sending (JavaMail or SendGrid)
        log.info("Sending email notification to {}", email);
        
        return true; // Stub
    }

    private boolean sendToPush(Notification notification) {
        Optional<NotificationConfig> config = configRepository.findByTenantId(notification.getTenant().getId());
        
        if (config.isEmpty() || config.get().getFirebaseProjectId() == null) {
            log.warn("Push notifications not configured for tenant {}", notification.getTenant().getId());
            return false;
        }
        
        // TODO: Implement Firebase Cloud Messaging
        log.info("Sending push notification to user {}", notification.getUser().getId());
        
        return true; // Stub
    }

    private boolean sendToSms(Notification notification) {
        String phone = notification.getUser().getPhone();
        if (phone == null) {
            log.warn("User {} has no phone number", notification.getUser().getId());
            return false;
        }
        
        // TODO: Implement SMS sending (Twilio, etc.)
        log.info("Sending SMS notification to {}", phone);
        
        return true; // Stub
    }

    private String formatTime(Instant instant) {
        return instant.toString(); // Could use DateTimeFormatter for locale-specific formatting
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
            .id(notification.getId())
            .type(notification.getType().name())
            .title(notification.getTitle())
            .body(notification.getBody())
            .data(notification.getData())
            .channels(notification.getChannels().stream().map(Enum::name).toList())
            .priority(notification.getPriority().name())
            .deliveryStatus(notification.getDeliveryStatus())
            .readAt(notification.getReadAt())
            .sentAt(notification.getSentAt())
            .createdAt(notification.getCreatedAt())
            .build();
    }
}

