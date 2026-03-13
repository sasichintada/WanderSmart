import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { NotificationComponent } from './components/shared/notification/notification.component';
import { ConnectionStatusComponent } from './components/shared/connection-status/connection-status.component';
import { SignalRService } from './services/signalr.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    NavbarComponent, 
    FooterComponent, 
    NotificationComponent,
    ConnectionStatusComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <app-navbar></app-navbar>
      <main class="container mx-auto px-4 py-8">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      <app-notification></app-notification>
      <!-- Commented out to remove connection status message -->
      <!-- <app-connection-status></app-connection-status> -->
    </div>
  `
})
export class AppComponent implements OnInit {
  title = 'wandersmart';

  constructor(
    private signalRService: SignalRService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // SIGNALR COMPLETELY DISABLED - Nothing will initialize
    console.log('🔇 SignalR disabled - no connection attempts');
    
    // All SignalR code is removed - no connections, no reconnection messages
    
    // If you want to keep the code for later but keep it disabled,
    // everything is commented out below
    
    /*
    // Request notification permission
    this.signalRService.requestNotificationPermission();
    
    // Start SignalR connection when user logs in
    this.authService.currentUser$.subscribe(user => {
      if (user?.id) {
        console.log('User logged in, starting SignalR');
        setTimeout(() => {
          this.signalRService.startConnection();
        }, 1000);
      } else {
        console.log('User logged out, stopping SignalR');
        this.signalRService.stopConnection();
      }
    });

    // Also try to connect if there's already a token (page refresh)
    if (this.authService.isAuthenticated()) {
      setTimeout(() => {
        this.signalRService.startConnection();
      }, 1000);
    }
    */
  }
}