import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ItineraryService } from '../../services/itinerary.service'; // Add this import
import { User, UserActivity, LoginHistory } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Welcome Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold">Welcome, {{ user?.firstName || user?.username || 'User' }}!</h1>
        <p class="text-gray-400">Last login: {{ lastLogin | date:'medium' }}</p>
      </div>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-effect p-6 rounded-2xl">
          <div class="text-gray-400 mb-2">Login Count</div>
          <div class="text-3xl font-bold">{{ user?.loginCount || 0 }}</div>
        </div>
        <div class="glass-effect p-6 rounded-2xl">
          <div class="text-gray-400 mb-2">Total Trips</div>
          <div class="text-3xl font-bold">{{ totalTrips }}</div>
        </div>
        <div class="glass-effect p-6 rounded-2xl">
          <div class="text-gray-400 mb-2">Cities Visited</div>
          <div class="text-3xl font-bold">{{ citiesVisited }}</div>
        </div>
        <div class="glass-effect p-6 rounded-2xl">
          <div class="text-gray-400 mb-2">Account Status</div>
          <div class="text-sm font-bold text-green-400">Active</div>
        </div>
      </div>

      <!-- Rest of your template remains exactly the same -->
      <!-- User Info Card -->
      <div class="glass-effect p-6 rounded-2xl">
        <h2 class="text-xl font-semibold mb-4">Profile Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-gray-400 text-sm">Username</p>
            <p class="font-medium">{{ user?.username }}</p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Email</p>
            <p class="font-medium">{{ user?.email }}</p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Full Name</p>
            <p class="font-medium">{{ user?.fullName || 'Not provided' }}</p>
          </div>
          <div>
            <p class="text-gray-400 text-sm">Role</p>
            <p class="font-medium">{{ user?.role || 'User' }}</p>
          </div>
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="glass-effect p-6 rounded-2xl">
        <h2 class="text-xl font-semibold mb-4">Recent Activities</h2>
        <div class="space-y-3">
          <div *ngFor="let activity of recentActivities" class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div>
              <div class="font-medium">{{ activity.activityType }}</div>
              <div class="text-sm text-gray-400">{{ activity.description }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-400">{{ activity.timestamp | date:'medium' }}</div>
            </div>
          </div>
          <div *ngIf="loading" class="text-center text-gray-400 py-4">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p class="mt-2">Loading activities...</p>
          </div>
          <div *ngIf="!loading && recentActivities.length === 0" class="text-center text-gray-400 py-4">
            No recent activities
          </div>
        </div>
      </div>

      <!-- Login History -->
      <div class="glass-effect p-6 rounded-2xl">
        <h2 class="text-xl font-semibold mb-4">Login History</h2>
        <div class="space-y-3">
          <div *ngFor="let login of loginHistory" class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div>
              <div class="font-medium">{{ login.location || 'Unknown location' }}</div>
              <div class="text-sm text-gray-400">{{ login.deviceInfo }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm">{{ login.loginTime | date:'medium' }}</div>
              <div class="text-xs" [class.text-green-400]="login.isSuccessful" [class.text-red-400]="!login.isSuccessful">
                {{ login.isSuccessful ? 'Successful' : 'Failed' }}
              </div>
            </div>
          </div>
          <div *ngIf="loadingHistory" class="text-center text-gray-400 py-4">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p class="mt-2">Loading login history...</p>
          </div>
          <div *ngIf="!loadingHistory && loginHistory.length === 0" class="text-center text-gray-400 py-4">
            No login history available
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a routerLink="/planner" class="glass-effect p-6 rounded-2xl text-center hover:scale-105 transition-all duration-300">
          <div class="text-4xl mb-3">✈️</div>
          <h3 class="font-semibold">Plan New Trip</h3>
          <p class="text-sm text-gray-400 mt-2">Create a new itinerary</p>
        </a>
        <a routerLink="/itinerary" class="glass-effect p-6 rounded-2xl text-center hover:scale-105 transition-all duration-300">
          <div class="text-4xl mb-3">📋</div>
          <h3 class="font-semibold">My Itineraries</h3>
          <p class="text-sm text-gray-400 mt-2">View your saved trips</p>
        </a>
        <a routerLink="/city" class="glass-effect p-6 rounded-2xl text-center hover:scale-105 transition-all duration-300">
          <div class="text-4xl mb-3">🌍</div>
          <h3 class="font-semibold">Explore Cities</h3>
          <p class="text-sm text-gray-400 mt-2">Discover new destinations</p>
        </a>
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
export class DashboardComponent implements OnInit {
  user: User | null = null;
  totalTrips = 0;
  citiesVisited = 0;
  lastLogin: Date | null = null;
  
  recentActivities: UserActivity[] = [];
  loginHistory: LoginHistory[] = [];
  
  loading = false;
  loadingHistory = false;

  constructor(
    private authService: AuthService,
    private itineraryService: ItineraryService  // Add this
  ) {}

  ngOnInit() {
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user?.lastLoginAt) {
        this.lastLogin = new Date(user.lastLoginAt);
      }
    });
    
    // Load user activities from API
    this.loadUserActivities();
    
    // Load login history
    this.loadLoginHistory();
    
    // Load user stats from real data
    this.loadUserStats();
  }

  private loadUserActivities() {
    this.loading = true;
    this.authService.getUserActivities(10).subscribe({
      next: (activities) => {
        this.recentActivities = activities;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.loading = false;
      }
    });
  }

  private loadLoginHistory() {
    this.loadingHistory = true;
    this.authService.getLoginHistory().subscribe({
      next: (history) => {
        this.loginHistory = history;
        this.loadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading login history:', error);
        this.loadingHistory = false;
        // If endpoint doesn't exist yet, just set empty array
        this.loginHistory = [];
      }
    });
  }

  private loadUserStats() {
    // Fetch REAL data from itinerary service
    this.itineraryService.getUserItineraries().subscribe({
      next: (itineraries) => {
        // Calculate total trips
        this.totalTrips = itineraries.length;
        
        // Calculate unique cities visited
        const uniqueCities = new Set(itineraries.map(i => i.destination));
        this.citiesVisited = uniqueCities.size;
      },
      error: (error) => {
        console.error('Error loading itineraries:', error);
        // Set to 0 on error instead of showing mock data
        this.totalTrips = 0;
        this.citiesVisited = 0;
      }
    });
  }
}