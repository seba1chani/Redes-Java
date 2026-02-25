import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebrtcService } from '../service/webrtc.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-webrtc-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './webrtc-chat.component.html',
  styleUrls: ['./webrtc-chat.component.css']
})
export class WebrtcChatComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  onlineUsers: string[] = [];
  selectedUser: string | null = null;
  inCall = false;
  audioEnabled = true;
  videoEnabled = true;
  showIncomingCall = false;
  incomingCallFrom: string = '';
  incomingMediaType: string = '';
  connectionStatus = false;
  currentUserId: string = '';

  private destroy$ = new Subject<void>();

  constructor(private webrtcService: WebrtcService) { }

  ngOnInit(): void {
    this.currentUserId = 'user-' + Math.random().toString(36).substr(2, 9);
    
    this.webrtcService.initialize(this.currentUserId)
      .then(() => {
        this.webrtcService.onlineUsers$
          .pipe(takeUntil(this.destroy$))
          .subscribe(users => {
            this.onlineUsers = users.filter(u => u !== this.currentUserId);
          });

        this.webrtcService.remoteStreamAvailable$
          .pipe(takeUntil(this.destroy$))
          .subscribe(stream => {
            if (this.remoteVideo) {
              this.remoteVideo.nativeElement.srcObject = stream;
            }
          });

        this.webrtcService.callInitiated$
          .pipe(takeUntil(this.destroy$))
          .subscribe(call => {
            this.incomingCallFrom = call.from;
            this.incomingMediaType = call.mediaType;
            this.showIncomingCall = true;
          });

        this.webrtcService.callEnded$
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.inCall = false;
            this.showIncomingCall = false;
          });

        this.webrtcService.connectionStatusChanged$
          .pipe(takeUntil(this.destroy$))
          .subscribe(status => {
            this.connectionStatus = status;
          });

        const localStream = this.webrtcService.getLocalStream();
        if (localStream && this.localVideo) {
          this.localVideo.nativeElement.srcObject = localStream;
        }
      })
      .catch(error => {
        console.error('Error inicializando WebRTC:', error);
        alert('Error: No se pudo acceder a micrófono/cámara. Verifica permisos.');
      });
  }

  selectUser(userId: string): void {
    this.selectedUser = userId;
    this.webrtcService.selectUser(userId);
  }

  async startCall(): Promise<void> {
    if (!this.selectedUser) {
      alert('Por favor selecciona un usuario');
      return;
    }

    try {
      await this.webrtcService.startCall('audio-video');
      this.inCall = true;
    } catch (error) {
      console.error('Error iniciando llamada:', error);
      alert('Error al iniciar la llamada');
    }
  }

  async acceptCall(): Promise<void> {
    try {
      await this.webrtcService.acceptCall();
      this.inCall = true;
      this.showIncomingCall = false;
    } catch (error) {
      console.error('Error aceptando llamada:', error);
    }
  }

  rejectCall(): void {
    this.webrtcService.rejectCall();
    this.showIncomingCall = false;
  }

  endCall(): void {
    this.webrtcService.endCall();
    this.inCall = false;
  }

  toggleAudio(): void {
    this.audioEnabled = !this.audioEnabled;
    this.webrtcService.toggleAudio(this.audioEnabled);
  }

  toggleVideo(): void {
    this.videoEnabled = !this.videoEnabled;
    this.webrtcService.toggleVideo(this.videoEnabled);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.webrtcService.disconnect();
  }
}