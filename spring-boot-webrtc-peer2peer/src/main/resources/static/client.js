const LOCAL_IP_ADDRESS = "YOUR_IP"; // change it

const getElement = id => document.getElementById(id);
const [btnConnect, btnToggleVideo, btnToggleAudio, divRoomConfig, roomDiv, roomNameInput, localVideo, remoteVideo] = ["btnConnect",
  "toggleVideo", "toggleAudio", "roomConfig", "roomDiv", "roomName",
  "localVideo", "remoteVideo"].map(getElement);
let remoteDescriptionPromise, roomName, localStream, remoteStream,
    rtcPeerConnection, isCaller;

// En red local los dispositivos se ven directo, no necesita STUN externo
const iceServers = { iceServers: [] };

const streamConstraints = {audio: true, video: true};

// Intenta obtener camara y microfono por separado
// Si falla uno, igual intenta el otro
async function getMediaStream() {
  let audioTrack = null;
  let videoTrack = null;

  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
    audioTrack = audioStream.getAudioTracks()[0];
  } catch (err) {
    console.warn("No se pudo acceder al microfono:", err.message);
  }

  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({audio: false, video: true});
    videoTrack = videoStream.getVideoTracks()[0];
  } catch (err) {
    console.warn("No se pudo acceder a la camara:", err.message);
  }

  const stream = new MediaStream();
  if (audioTrack) stream.addTrack(audioTrack);
  if (videoTrack) stream.addTrack(videoTrack);
  return stream;
}

let socket = io.connect("https://192.168.100.69", {secure: true});

btnToggleVideo.addEventListener("click", () => toggleTrack("video"));
btnToggleAudio.addEventListener("click", () => toggleTrack("audio"));

function toggleTrack(trackType) {
  if (!localStream) {
    return;
  }

  const track = trackType === "video" ? localStream.getVideoTracks()[0]
      : localStream.getAudioTracks()[0];

  if (!track) return; // no hay camara/microfono, no hacer nada

  const enabled = !track.enabled;
  track.enabled = enabled;

  const toggleButton = getElement(
      `toggle${trackType.charAt(0).toUpperCase() + trackType.slice(1)}`);
  const icon = getElement(`${trackType}Icon`);
  toggleButton.classList.toggle("disabled-style", !enabled);
  toggleButton.classList.toggle("enabled-style", enabled);
  icon.classList.toggle("bi-camera-video-fill",
      trackType === "video" && enabled);
  icon.classList.toggle("bi-camera-video-off-fill",
      trackType === "video" && !enabled);
  icon.classList.toggle("bi-mic-fill", trackType === "audio" && enabled);
  icon.classList.toggle("bi-mic-mute-fill", trackType === "audio" && !enabled);
}

btnConnect.onclick = () => {
  if (roomNameInput.value === "") {
    alert("Room can not be null!");
  } else {
    roomName = roomNameInput.value;
    socket.emit("joinRoom", roomName);
    divRoomConfig.classList.add("d-none");
    roomDiv.classList.remove("d-none");
  }
};

const handleSocketEvent = (eventName, callback) => socket.on(eventName,
    callback);

handleSocketEvent("created", e => {
  getMediaStream().then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    isCaller = true;
  });
});

handleSocketEvent("joined", e => {
  getMediaStream().then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
    socket.emit("ready", roomName);
  });
});

handleSocketEvent("candidate", e => {
  if (rtcPeerConnection) {
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: e.label, candidate: e.candidate,
    });

    rtcPeerConnection.onicecandidateerror = (error) => {
      console.error("Error adding ICE candidate: ", error);
    };

    if (remoteDescriptionPromise) {
      remoteDescriptionPromise
      .then(() => {
        if (candidate != null) {
          return rtcPeerConnection.addIceCandidate(candidate);
        }
      })
      .catch(error => console.log(
          "Error adding ICE candidate after remote description: ", error));
    }
  }
});

handleSocketEvent("ready", e => {
  if (isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    localStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track, localStream));
    rtcPeerConnection
    .createOffer()
    .then(sessionDescription => {
      rtcPeerConnection.setLocalDescription(sessionDescription);
      socket.emit("offer", {
        type: "offer", sdp: sessionDescription, room: roomName,
      });
    })
    .catch(error => console.log(error));
  }
});

handleSocketEvent("offer", e => {
  if (!isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    localStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track, localStream));

    if (rtcPeerConnection.signalingState === "stable") {
      remoteDescriptionPromise = rtcPeerConnection.setRemoteDescription(
          new RTCSessionDescription(e));
      remoteDescriptionPromise
      .then(() => {
        return rtcPeerConnection.createAnswer();
      })
      .then(sessionDescription => {
        rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit("answer", {
          type: "answer", sdp: sessionDescription, room: roomName,
        });
      })
      .catch(error => console.log(error));
    }
  }
});

handleSocketEvent("answer", e => {
  if (isCaller && rtcPeerConnection.signalingState === "have-local-offer") {
    remoteDescriptionPromise = rtcPeerConnection.setRemoteDescription(
        new RTCSessionDescription(e));
    remoteDescriptionPromise.catch(error => console.log(error));
  }
});

handleSocketEvent("userDisconnected", (e) => {
  remoteVideo.srcObject = null;
  isCaller = true;
});

handleSocketEvent("setCaller", callerId => {
  isCaller = socket.id === callerId;
});

handleSocketEvent("full", e => {
  alert("room is full!");
  window.location.reload();
});

const onIceCandidate = e => {
  if (e.candidate) {
    console.log("sending ice candidate");
    socket.emit("candidate", {
      type: "candidate",
      label: e.candidate.sdpMLineIndex,
      id: e.candidate.sdpMid,
      candidate: e.candidate.candidate,
      room: roomName,
    });
  }
}

const onAddStream = e => {
  remoteVideo.srcObject = e.streams[0];
  remoteStream = e.stream;
}
