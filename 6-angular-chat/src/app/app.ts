import { Component, signal } from '@angular/core';
import { ChatComponents } from "./components/chat-components";

@Component({
  selector: 'app-root',
  imports: [ChatComponents],
  templateUrl: './app.html'
})
export class App {
  
}
