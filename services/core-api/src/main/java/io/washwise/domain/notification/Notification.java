package io.washwise.domain.notification;

import io.washwise.domain.tenant.Tenant;
import io.washwise.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Notification entity for user notifications.
 */
@Entity
@Table(name = "notifications",
    indexes = {
        @Index(name = "idx_notifications_tenant", columnList = "tenant_id"),
        @Index(name = "idx_notifications_user", columnList = "user_id"),
        @Index(name = "idx_notifications_type", columnList = "type"),
        @Index(name = "idx_notifications_read", columnList = "read_at"),
        @Index(name = "idx_notifications_scheduled", columnList = "scheduled_for")
    })
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> data = Map.of();

    @ElementCollection(targetClass = NotificationChannel.class)
    @CollectionTable(name = "notification_channels", joinColumns = @JoinColumn(name = "notification_id"))
    @Column(name = "channel")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<NotificationChannel> channels = new HashSet<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "delivery_status", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> deliveryStatus = Map.of();

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "scheduled_for")
    private Instant scheduledFor;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private NotificationPriority priority = NotificationPriority.NORMAL;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
