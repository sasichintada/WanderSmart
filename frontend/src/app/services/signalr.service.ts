import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  private retryCount = 0;
  private maxRetries = 5;
  
  // Flag to completely disable SignalR
  private signalREnabled = false; // Set to false to disable, true to enable

  constructor(
    private ngZone: NgZone,
    private authService: AuthService
  ) {}

  public startConnection(): void {
    // COMPLETELY DISABLE SIGNALR - add this return at the top
    console.log('🔇 SignalR is disabled - no connection will be attempted');
    return;
    
    // The code below will NEVER run because of the return above
    /*
    const token = this.authService.getToken();
    
    if (!token) {
      console.log('No token available, SignalR connection deferred');
      return;
    }

    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR already connected');
      return;
    }

    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5116/notificationHub', {
          accessTokenFactory: () => token,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.setupSignalREvents();
      
      this.hubConnection.start()
        .then(() => {
          console.log('✅ SignalR connection started successfully');
          this.connectionStatusSubject.next(true);
          this.retryCount = 0;
          this.registerEvents();
        })
        .catch((err: any) => {
          console.error('❌ Error starting SignalR connection:', err);
          this.connectionStatusSubject.next(false);
          this.handleConnectionError(err);
        });
    } catch (err: any) {
      console.error('❌ Error building SignalR connection:', err);
      this.handleConnectionError(err);
    }
    */
  }

  private setupSignalREvents(): void {
    if (!this.hubConnection) return;

    this.hubConnection.onreconnecting((error?: Error) => {
      console.log('SignalR reconnecting due to error:', error);
      this.connectionStatusSubject.next(false);
    });

    this.hubConnection.onreconnected((connectionId?: string) => {
      console.log('SignalR reconnected with ID:', connectionId);
      this.connectionStatusSubject.next(true);
      this.registerEvents();
    });

    this.hubConnection.onclose((error?: Error) => {
      console.log('SignalR connection closed:', error);
      this.connectionStatusSubject.next(false);
      this.handleConnectionError(error);
    });
  }

  private handleConnectionError(error: any): void {
    // Don't retry if it's an authentication error
    if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
      console.log('Authentication failed for SignalR. User may need to login again.');
      return;
    }

    this.retryCount++;
    if (this.retryCount <= this.maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
      console.log(`Retrying connection in ${delay}ms... (Attempt ${this.retryCount}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.startConnection();
      }, delay);
    } else {
      console.error('Max retries reached. Unable to connect to SignalR hub.');
      
      // Error notification removed to prevent "Reconnecting to server..." message
      // this.showErrorNotification();
    }
  }

  private registerEvents(): void {
    if (!this.hubConnection) return;

    // Remove any existing handlers to prevent duplicates
    this.hubConnection.off('ReceiveNotification');
    this.hubConnection.off('ItineraryUpdated');
    this.hubConnection.off('WeatherAlert');
    this.hubConnection.off('TravelDeal');
    this.hubConnection.off('ActivityUpdate');

    // Receive new notification
    this.hubConnection.on('ReceiveNotification', (data: any) => {
      console.log('📬 Received notification:', data);
      this.ngZone.run(() => {
        const notification: Notification = {
          id: Date.now().toString(),
          type: data.type || 'info',
          title: data.title || 'Notification',
          message: data.message || data,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          read: false,
          data: data
        };
        
        const currentNotifications = this.notificationsSubject.value;
        this.notificationsSubject.next([notification, ...currentNotifications]);
        
        this.showBrowserNotification(notification);
      });
    });

    // Receive activity update
    this.hubConnection.on('ActivityUpdate', (activity: any) => {
      console.log('📊 Activity update:', activity);
      this.ngZone.run(() => {
        const notification: Notification = {
          id: Date.now().toString(),
          type: 'info',
          title: 'Activity Update',
          message: `New activity: ${activity.description || 'Update available'}`,
          timestamp: new Date(),
          read: false,
          data: activity
        };
        
        const currentNotifications = this.notificationsSubject.value;
        this.notificationsSubject.next([notification, ...currentNotifications]);
      });
    });

    // Receive itinerary update
    this.hubConnection.on('ItineraryUpdated', (data: any) => {
      console.log('📅 Itinerary updated:', data);
      this.ngZone.run(() => {
        const notification: Notification = {
          id: Date.now().toString(),
          type: 'success',
          title: 'Itinerary Updated',
          message: `Your itinerary for ${data.destination || 'your trip'} has been updated.`,
          timestamp: new Date(),
          read: false,
          data: data
        };
        
        const currentNotifications = this.notificationsSubject.value;
        this.notificationsSubject.next([notification, ...currentNotifications]);
      });
    });

    // Receive weather alert
    this.hubConnection.on('WeatherAlert', (alert: any) => {
      console.log('⛈️ Weather alert:', alert);
      this.ngZone.run(() => {
        const notification: Notification = {
          id: Date.now().toString(),
          type: 'warning',
          title: 'Weather Alert',
          message: alert.message || 'Weather conditions may affect your travel plans.',
          timestamp: new Date(),
          read: false,
          data: alert
        };
        
        const currentNotifications = this.notificationsSubject.value;
        this.notificationsSubject.next([notification, ...currentNotifications]);
      });
    });

    // Receive travel deal
    this.hubConnection.on('TravelDeal', (deal: any) => {
      console.log('🏷️ Travel deal:', deal);
      this.ngZone.run(() => {
        const notification: Notification = {
          id: Date.now().toString(),
          type: 'info',
          title: 'Special Deal!',
          message: deal.description || 'Check out this amazing travel deal!',
          timestamp: new Date(),
          read: false,
          data: deal
        };
        
        const currentNotifications = this.notificationsSubject.value;
        this.notificationsSubject.next([notification, ...currentNotifications]);
      });
    });
  }

  private showBrowserNotification(notification: Notification): void {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/icon-72x72.png'
      });
    } else if (Notification.permission !== 'denied') {
      this.requestNotificationPermission();
    }
  }

  public requestNotificationPermission(): void {
    if (!('Notification' in window)) return;

    Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }

  public joinUserGroup(userId: string): void {
    console.log(`User ${userId} would be added to group if SignalR was enabled`);
  }

  public joinItineraryGroup(itineraryId: string): void {
    console.log(`Would join itinerary group: ${itineraryId} if SignalR was enabled`);
  }

  public leaveItineraryGroup(itineraryId: string): void {
    console.log(`Would leave itinerary group: ${itineraryId} if SignalR was enabled`);
  }

  public sendNotification(userId: string, message: string, type: string = 'info'): void {
    console.log(`Would send notification to ${userId} if SignalR was enabled`);
  }

  public sendActivityUpdate(userId: string, activity: any): void {
    console.log(`Would send activity update to ${userId} if SignalR was enabled`);
  }

  public markAsRead(notificationId: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updated = currentNotifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(updated);
  }

  public clearNotifications(): void {
    this.notificationsSubject.next([]);
  }

  public getConnectionState(): signalR.HubConnectionState | null {
    return null;
  }

  public stopConnection(): void {
    console.log('SignalR is disabled - nothing to stop');
  }

  public reconnect(): void {
    console.log('SignalR is disabled - cannot reconnect');
  }

  // Method to enable SignalR if needed later
  public enableSignalR(): void {
    console.log('SignalR enabled - but you need to remove the return in startConnection()');
    // To actually enable, you'd need to remove the 'return' at the top of startConnection()
  }
}