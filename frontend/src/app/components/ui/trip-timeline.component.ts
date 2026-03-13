import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trip-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div *ngFor="let day of days" class="glass-effect p-6 rounded-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Day {{ day.day }} - {{ day.date | date:'fullDate' }}</h3>
          <span class="px-3 py-1 bg-blue-600/50 rounded-lg text-sm">
            Total: ₹{{ getDayTotal(day) | number:'1.0-0' }}
          </span>
        </div>
        
        <div class="space-y-3">
          <div *ngFor="let activity of day.activities" class="flex items-start space-x-3">
            <div class="w-16 text-sm text-gray-400">{{ activity.time }}</div>
            <div class="flex-1">
              <div class="font-medium">{{ activity.title }}</div>
              <div class="text-sm text-gray-400">{{ activity.description }}</div>
            </div>
            <div class="text-sm">₹{{ activity.cost | number:'1.0-0' }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-effect {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  `]
})
export class TripTimelineComponent {
  @Input() days: any[] = [];

  getDayTotal(day: any): number {
    return day.activities.reduce((sum: number, activity: any) => sum + (activity.cost || 0), 0);
  }
}