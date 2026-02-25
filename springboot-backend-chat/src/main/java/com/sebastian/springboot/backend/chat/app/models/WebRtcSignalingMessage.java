package com.sebastian.springboot.backend.chat.app.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebRtcSignalingMessage {
    @JsonProperty("type")
    private String type;

    @JsonProperty("from")
    private String from;

    @JsonProperty("to")
    private String to;

    @JsonProperty("sdp")
    private String sdp;

    @JsonProperty("candidate")
    private IceCandidate candidate;

    @JsonProperty("mediaType")
    private String mediaType;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IceCandidate {
        private String candidate;
        private String sdpMLineIndex;
        private String sdpMid;
    }
}