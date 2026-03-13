import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService, Notification } from '../../../services/signalr.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-20 right-4 z-50 w-80">
      <div *ngFor="let notification of notifications" 
           class="mb-2 p-4 rounded-lg shadow-lg animate-slide-in"
           [class.bg-blue-500]="notification.type === 'info'"
           [class.bg-green-500]="notification.type === 'success'"
           [class.bg-yellow-500]="notification.type === 'warning'"
           [class.bg-red-500]="notification.type === 'error'"
           [class.opacity-75]="notification.read">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-semibold">{{ notification.title }}</h4>
            <p class="text-sm">{{ notification.message }}</p>
            <p class="text-xs mt-1 opacity-75">{{ notification.timestamp | date:'short' }}</p>
          </div>
          <button (click)="dismiss(notification.id)" class="ml-2 text-white hover:text-gray-200">
            ✕
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class NotificationComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private signalRService: SignalRService) {}

  ngOnInit() {
    this.signalRService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      
      // Auto-dismiss after 5 seconds
      notifications.forEach(n => {
        if (!n.read) {
          setTimeout(() => this.dismiss(n.id), 5000);
        }
      });
    });
  }

  dismiss(id: string) {
    this.signalRService.markAsRead(id);
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
    }, 300);
  }
}