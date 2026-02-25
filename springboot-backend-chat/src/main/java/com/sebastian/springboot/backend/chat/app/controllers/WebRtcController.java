package com.sebastian.springboot.backend.chat.app.controllers;
import com.sebastian.springboot.backend.chat.app.models.CallSession;
import com.sebastian.springboot.backend.chat.app.models.UserConnection;
import com.sebastian.springboot.backend.chat.app.services.WebRtcSignalingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/webrtc")
@CrossOrigin(origins = "*")
public class WebRtcController {

    private final WebRtcSignalingService signalingService;

    public WebRtcController(WebRtcSignalingService signalingService) {
        this.signalingService = signalingService;
    }

    @GetMapping("/users/online")
    public ResponseEntity<List<String>> getOnlineUsers() {
        return ResponseEntity.ok(signalingService.getOnlineUsers());
    }

    @GetMapping("/user/{userId}/connection")
    public ResponseEntity<UserConnection> getUserConnection(@PathVariable String userId) {
        UserConnection connection = signalingService.getUserConnection(userId);
        if (connection != null) {
            return ResponseEntity.ok(connection);
        }
        return ResponseEntity.notFound().build();
    }
}