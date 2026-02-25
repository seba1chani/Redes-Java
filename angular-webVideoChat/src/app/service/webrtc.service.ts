import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebrtcService {
  private socket: WebSocket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  // Observables
  public onlineUsers$ = new BehaviorSubject<string[]>([]);
  public remoteStreamAvailable$ = new Subject<MediaStream>();
  public callInitiated$ = new Subject<{ from: string; mediaType: string }>();
  public callEnded$ = new Subject<void>();
  public connectionStatusChanged$ = new BehaviorSubject<boolean>(false);

  private currentUser: string = '';
  private selectedUser: string = '';
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  constructor() { }

  public initialize(userId: string): Promise<void> {
    this.currentUser = userId;
    return this.connectWebSocket().then(() => this.startLocalStream());
  }

  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.socket = new WebSocket(
        `${protocol}//${window.location.hostname}:8080/ws/webrtc?userId=${this.currentUser}`
      );

      this.socket.onopen = () => {
        console.log('WebSocket conectado');
        this.connectionStatusChanged$.next(true);
        resolve();
      };

      this.socket.onerror = (event) => {
        console.error('WebSocket error', event);
      };

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message', message);
        this.handleWebSocketMessage(message);
      };

      this.socket.onerror = (error) => {
        console.error('Error WebSocket:', error);
        this.connectionStatusChanged$.next(false);
        reject(error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket cerrado');
        this.connectionStatusChanged$.next(false);
      };
    });
  }

  private startLocalStream(): Promise<void> {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    }).then(stream => {
      this.localStream = stream;
    }).catch(error => {
      console.error('Error obteniendo stream local:', error);
      throw error;
    });
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  public selectUser(userId: string): void {
    this.selectedUser = userId;
  }

  public async startCall(mediaType: string = 'audio-video'): Promise<void> {
    if (!this.selectedUser) {
      throw new Error('Por favor selecciona un usuario');
    }

    try {
      const peerConnectionConfig = { iceServers: this.iceServers };
      this.peerConnection = new RTCPeerConnection(peerConnectionConfig);

      if (this.localStream) {
        for (const track of this.localStream.getTracks()) {
          this.peerConnection!.addTrack(track, this.localStream);
        }
      }

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignalingMessage({
            type: 'ice-candidate',
            from: this.currentUser,
            to: this.selectedUser,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMLineIndex: event.candidate.sdpMLineIndex?.toString() || '',
              sdpMid: event.candidate.sdpMid || ''
            }
          });
        }
      };

      this.peerConnection.ontrack = (event) => {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
          this.remoteStreamAvailable$.next(this.remoteStream);
        }
        this.remoteStream!.addTrack(event.track);
      };

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.sendSignalingMessage({
        type: 'offer',
        from: this.currentUser,
        to: this.selectedUser,
        sdp: this.peerConnection.localDescription?.sdp || '',
        mediaType: mediaType
      });
    } catch (error) {
      console.error('Error iniciando llamada:', error);
      throw error;
    }
  }

  public async acceptCall(): Promise<void> {
    try {
      if (!this.peerConnection) {
        const peerConnectionConfig = { iceServers: this.iceServers };
        this.peerConnection = new RTCPeerConnection(peerConnectionConfig);

        if (this.localStream) {
          for (const track of this.localStream.getTracks()) {
            this.peerConnection!.addTrack(track, this.localStream);
          }
        }

        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.sendSignalingMessage({
              type: 'ice-candidate',
              from: this.currentUser,
              to: this.selectedUser,
              candidate: {
                candidate: event.candidate.candidate,
                sdpMLineIndex: event.candidate.sdpMLineIndex?.toString() || '',
                sdpMid: event.candidate.sdpMid || ''
              }
            });
          }
        };

        this.peerConnection.ontrack = (event) => {
          if (!this.remoteStream) {
            this.remoteStream = new MediaStream();
            this.remoteStreamAvailable$.next(this.remoteStream);
          }
          this.remoteStream!.addTrack(event.track);
        };
      }

      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      this.sendSignalingMessage({
        type: 'answer',
        from: this.currentUser,
        to: this.selectedUser,
        sdp: this.peerConnection!.localDescription?.sdp || ''
      });
    } catch (error) {
      console.error('Error aceptando llamada:', error);
      throw error;
    }
  }

  public rejectCall(): void {
    this.sendSignalingMessage({
      type: 'hang-up',
      from: this.currentUser,
      to: this.selectedUser
    });
  }

  public endCall(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    this.sendSignalingMessage({
      type: 'hang-up',
      from: this.currentUser,
      to: this.selectedUser
    });

    this.callEnded$.next();
    this.selectedUser = '';
  }

  public toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  public toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  private sendSignalingMessage(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private async handleWebSocketMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'online-users':
        this.onlineUsers$.next(message.users);
        break;

      case 'offer':
        this.selectedUser = message.from;
        this.callInitiated$.next({
          from: message.from,
          mediaType: message.mediaType || 'audio-video'
        });
        await this.handleOffer(message);
        break;

      case 'answer':
        await this.handleAnswer(message);
        break;

      case 'ice-candidate':
        await this.handleIceCandidate(message);
        break;

      case 'hang-up':
        this.endCall();
        break;
    }
  }

  private async handleOffer(message: any): Promise<void> {
    try {
      if (!this.peerConnection) {
        const peerConnectionConfig = { iceServers: this.iceServers };
        this.peerConnection = new RTCPeerConnection(peerConnectionConfig);

        if (this.localStream) {
          for (const track of this.localStream.getTracks()) {
            this.peerConnection!.addTrack(track, this.localStream);
          }
        }

        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.sendSignalingMessage({
              type: 'ice-candidate',
              from: this.currentUser,
              to: message.from,
              candidate: {
                candidate: event.candidate.candidate,
                sdpMLineIndex: event.candidate.sdpMLineIndex?.toString() || '',
                sdpMid: event.candidate.sdpMid || ''
              }
            });
          }
        };

        this.peerConnection.ontrack = (event) => {
          if (!this.remoteStream) {
            this.remoteStream = new MediaStream();
            this.remoteStreamAvailable$.next(this.remoteStream);
          }
          this.remoteStream!.addTrack(event.track);
        };
      }

      await this.peerConnection!.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: message.sdp })
      );
    } catch (error) {
      console.error('Error manejando offer:', error);
    }
  }

  private async handleAnswer(message: any): Promise<void> {
    try {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: message.sdp })
        );
      }
    } catch (error) {
      console.error('Error manejando answer:', error);
    }
  }

  private async handleIceCandidate(message: any): Promise<void> {
    try {
      if (this.peerConnection && message.candidate?.candidate) {
        await this.peerConnection.addIceCandidate(
          new RTCIceCandidate(message.candidate)
        );
      }
    } catch (error) {
      console.error('Error agregando ICE candidate:', error);
    }
  }

  public disconnect(): void {
    this.endCall();
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}