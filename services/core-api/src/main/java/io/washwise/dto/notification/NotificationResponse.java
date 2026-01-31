package io.washwise.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private UUID id;
    private String type;
    private String title;
    private String body;
    private Map<String, Object> data;
    private List<String> channels;
    private String priority;
    private Map<String, Object> deliveryStatus;
    private Instant readAt;
    private Instant sentAt;
    private Instant createdAt;
}
