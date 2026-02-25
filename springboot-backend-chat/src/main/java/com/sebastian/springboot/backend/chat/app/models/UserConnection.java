package com.sebastian.springboot.backend.chat.app.models;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class UserConnection {
    private String userId;
    private String sessionId;
    private boolean inCall;
    private String callPartner;
    private String mediaType;
}
