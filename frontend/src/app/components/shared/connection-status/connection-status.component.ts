import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="!isConnected" class="fixed bottom-4 left-4 z-50">
      <div class="bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <div class="animate-pulse w-2 h-2 bg-red-600 rounded-full"></div>
        <span class="text-sm">Reconnecting to server...</span>
        <button (click)="reconnect()" class="ml-2 text-xs bg-black text-white px-2 py-1 rounded hover:bg-gray-800">
          Retry
        </button>
      </div>
    </div>
  `
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
  isConnected = true;
  private subscription: Subscription;

  constructor(private signalRService: SignalRService) {
    this.subscription = this.signalRService.connectionStatus$.subscribe(
      status => this.isConnected = status
    );
  }

  ngOnInit() {
    // Start connection if not already started
    this.signalRService.startConnection();
  }

  reconnect() {
    this.signalRService.reconnect();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}