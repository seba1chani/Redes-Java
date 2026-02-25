package com.sebastian.springboot.backend.chat.app.models;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class CallSession {

    private String sessionId;
    private String initiatorId;
    private String recipientId;
    private String status;
    private String mediaType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int durationSeconds;

}
