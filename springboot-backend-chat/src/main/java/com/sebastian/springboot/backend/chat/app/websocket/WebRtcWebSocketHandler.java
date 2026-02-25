package com.sebastian.springboot.backend.chat.app.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sebastian.springboot.backend.chat.app.models.WebRtcSignalingMessage;
import com.sebastian.springboot.backend.chat.app.services.WebRtcSignalingService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebRtcWebSocketHandler extends TextWebSocketHandler {

    private final WebRtcSignalingService signalingService;
    private final ObjectMapper objectMapper;
    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();

    public WebRtcWebSocketHandler(WebRtcSignalingService signalingService, ObjectMapper objectMapper) {
        this.signalingService = signalingService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = extractUserIdFromSession(session);
        if (userId != null && !userId.isEmpty()) {
            userSessions.put(userId, session);
            sessionUserMap.put(session.getId(), userId);
            signalingService.registerUser(userId, session.getId());
            broadcastOnlineUsers();
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            WebRtcSignalingMessage signalingMsg = objectMapper.readValue(
                    message.getPayload(),
                    WebRtcSignalingMessage.class
            );

            processSignalingMessage(signalingMsg, session);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = sessionUserMap.remove(session.getId());
        if (userId != null) {
            userSessions.remove(userId);
            signalingService.disconnectUser(userId);
            broadcastOnlineUsers();
        }
    }

    private void processSignalingMessage(WebRtcSignalingMessage message, WebSocketSession senderSession) throws Exception {
        String messageType = message.getType();

        switch (messageType) {
            case "offer":
            case "answer":
            case "ice-candidate":
            case "hang-up":
                forwardSignalingMessage(message);
                break;
        }
    }

    private void forwardSignalingMessage(WebRtcSignalingMessage message) throws Exception {
        String recipientId = message.getTo();
        WebSocketSession recipientSession = userSessions.get(recipientId);

        if (recipientSession != null && recipientSession.isOpen()) {
            String messageJson = objectMapper.writeValueAsString(message);
            recipientSession.sendMessage(new TextMessage(messageJson));
        }
    }

    private void broadcastOnlineUsers() throws Exception {
        List<String> onlineUsers = signalingService.getOnlineUsers();
        Map<String, Object> message = new HashMap<>();
        message.put("type", "online-users");
        message.put("users", onlineUsers);

        String messageJson = objectMapper.writeValueAsString(message);
        TextMessage textMessage = new TextMessage(messageJson);

        for (WebSocketSession session : userSessions.values()) {
            if (session.isOpen()) {
                session.sendMessage(textMessage);
            }
        }
    }

    private String extractUserIdFromSession(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null && !query.isEmpty()) {
            String[] params = query.split("&");
            for (String param : params) {
                if (param.startsWith("userId=")) {
                    return param.substring(7);
                }
            }
        }
        return null;
    }
}