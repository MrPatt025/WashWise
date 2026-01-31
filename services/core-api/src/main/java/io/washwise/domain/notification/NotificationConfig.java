package io.washwise.domain.notification;

import io.washwise.domain.tenant.Tenant;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Notification configuration per tenant.
 * Stores credentials and settings for notification channels.
 */
@Entity
@Table(name = "notification_configs")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tenant_id", nullable = false, unique = true)
    private Tenant tenant;

    // LINE Messaging API
    @Column(name = "line_channel_id", length = 100)
    private String lineChannelId;

    @Column(name = "line_channel_secret", length = 255)
    private String lineChannelSecret;

    @Column(name = "line_access_token", columnDefinition = "text")
    private String lineAccessToken;

    // SMTP Email
    @Column(name = "smtp_host", length = 255)
    private String smtpHost;

    @Column(name = "smtp_port")
    private Integer smtpPort;

    @Column(name = "smtp_user", length = 255)
    private String smtpUser;

    @Column(name = "smtp_password", length = 255)
    private String smtpPassword;

    @Column(name = "smtp_from_email", length = 255)
    private String smtpFromEmail;

    @Column(name = "smtp_from_name", length = 100)
    private String smtpFromName;

    // Firebase Cloud Messaging
    @Column(name = "firebase_project_id", length = 100)
    private String firebaseProjectId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "firebase_credentials", columnDefinition = "jsonb")
    private Map<String, Object> firebaseCredentials;

    // Templates (JSON format for flexibility)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> templates = Map.of();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
