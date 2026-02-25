import { Component } from '@angular/core';
import { WebrtcChatComponent } from './components/webrtc-chat.component';

@Component({
  selector: 'app-root', 
  standalone: true,
  imports: [WebrtcChatComponent],
  template: '<app-webrtc-chat></app-webrtc-chat>',
  styles: []
})
export class AppComponent {
  title = 'chat-webrtc';
}