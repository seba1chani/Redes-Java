package com.sebastian.springboot.backend.chat.app.services;
import com.sebastian.springboot.backend.chat.app.models.CallSession;
import com.sebastian.springboot.backend.chat.app.models.UserConnection;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebRtcSignalingService {

    private final Map<String, UserConnection> activeConnections = new ConcurrentHashMap<>();
    private final Map<String, CallSession> activeCalls = new ConcurrentHashMap<>();

    public void registerUser(String userId, String sessionId) {
        UserConnection connection = UserConnection.builder()
                .userId(userId)
                .sessionId(sessionId)
                .inCall(false)
                .build();
        activeConnections.put(userId, connection);
    }

    public void disconnectUser(String userId) {
        UserConnection connection = activeConnections.get(userId);
        if (connection != null && connection.isInCall()) {
            endCall(connection.getCallPartner(), userId);
        }
        activeConnections.remove(userId);
    }

    public CallSession initiateCall(String initiatorId, String recipientId, String mediaType) {
        if (!isUserOnline(recipientId)) {
            return null;
        }

        String sessionId = UUID.randomUUID().toString();
        CallSession session = CallSession.builder()
                .sessionId(sessionId)
                .initiatorId(initiatorId)
                .recipientId(recipientId)
                .status("pending")
                .mediaType(mediaType)
                .startTime(LocalDateTime.now())
                .build();

        activeCalls.put(sessionId, session);
        return session;
    }

    public boolean acceptCall(String sessionId, String userId) {
        CallSession session = activeCalls.get(sessionId);
        if (session == null || !session.getRecipientId().equals(userId)) {
            return false;
        }

        session.setStatus("active");

        UserConnection initiator = activeConnections.get(session.getInitiatorId());
        UserConnection recipient = activeConnections.get(userId);

        if (initiator != null && recipient != null) {
            initiator.setInCall(true);
            initiator.setCallPartner(userId);
            initiator.setMediaType(session.getMediaType());

            recipient.setInCall(true);
            recipient.setCallPartner(session.getInitiatorId());
            recipient.setMediaType(session.getMediaType());
        }

        return true;
    }

    public void rejectCall(String sessionId) {
        CallSession session = activeCalls.get(sessionId);
        if (session != null) {
            session.setStatus("rejected");
            activeCalls.remove(sessionId);
        }
    }

    public void endCall(String userId, String callPartnerId) {
        UserConnection connection = activeConnections.get(userId);
        if (connection != null) {
            connection.setInCall(false);
            connection.setCallPartner(null);
            connection.setMediaType(null);
        }

        for (CallSession session : new ArrayList<>(activeCalls.values())) {
            if ((session.getInitiatorId().equals(userId) &&
                    session.getRecipientId().equals(callPartnerId)) ||
                    (session.getInitiatorId().equals(callPartnerId) &&
                            session.getRecipientId().equals(userId))) {
                session.setStatus("ended");
                session.setEndTime(LocalDateTime.now());
                session.setDurationSeconds(calculateDuration(session));
            }
        }
    }

    public boolean isUserOnline(String userId) {
        return activeConnections.containsKey(userId);
    }

    public List<String> getOnlineUsers() {
        return new ArrayList<>(activeConnections.keySet());
    }

    public UserConnection getUserConnection(String userId) {
        return activeConnections.get(userId);
    }

    public CallSession getCallSession(String sessionId) {
        return activeCalls.get(sessionId);
    }

    private int calculateDuration(CallSession session) {
        if (session.getEndTime() == null) {
            return 0;
        }
        return (int) java.time.temporal.ChronoUnit.SECONDS.between(
                session.getStartTime(),
                session.getEndTime()
        );
    }
}
