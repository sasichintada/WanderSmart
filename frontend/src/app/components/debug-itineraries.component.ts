import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItineraryService } from '../services/itinerary.service';
import { AuthService } from '../services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-debug-itineraries',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/90 z-50 overflow-auto p-4">
      <div class="max-w-4xl mx-auto bg-gray-900 rounded-xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-white">Itinerary Debug</h2>
          <button (click)="refresh()" class="bg-blue-600 text-white px-3 py-1 rounded text-sm">
            Refresh
          </button>
        </div>
        
        <div class="space-y-4">
          <!-- Current User Info -->
          <div class="bg-gray-800 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-green-400 mb-2">Current User</h3>
            <div *ngIf="currentUser; else noUser">
              <p><span class="text-gray-400">ID:</span> <span class="text-white">{{ currentUser.id }}</span></p>
              <p><span class="text-gray-400">Username:</span> <span class="text-white">{{ currentUser.username }}</span></p>
              <p><span class="text-gray-400">Email:</span> <span class="text-white">{{ currentUser.email }}</span></p>
              <p><span class="text-gray-400">Login Count:</span> <span class="text-white">{{ currentUser.loginCount }}</span></p>
            </div>
            <ng-template #noUser>
              <p class="text-yellow-400">No user logged in</p>
            </ng-template>
          </div>

          <!-- User ID from AuthService methods -->
          <div class="bg-gray-800 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-yellow-400 mb-2">AuthService Debug</h3>
            <p><span class="text-gray-400">getCurrentUserId():</span> <span class="text-white">{{ debugUserId || 'null' }}</span></p>
            <p><span class="text-gray-400">isAuthenticated():</span> <span class="text-white">{{ isAuthenticated }}</span></p>
          </div>

          <!-- My Itineraries -->
          <div class="bg-gray-800 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-blue-400 mb-2">My Itineraries (User ID: {{ currentUser?.id }})</h3>
            <div *ngIf="loading" class="text-gray-400 py-4 text-center">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p class="mt-2">Loading...</p>
            </div>
            <div *ngIf="!loading && myItineraries.length === 0" class="text-gray-400 py-4 text-center">
              No itineraries found for current user
            </div>
            <div *ngFor="let it of myItineraries" class="border-b border-gray-700 py-3 hover:bg-gray-700/30">
              <p><span class="text-gray-400">Title:</span> <span class="text-white">{{ it.title }}</span></p>
              <p><span class="text-gray-400">Destination:</span> <span class="text-white">{{ it.destination }}</span></p>
              <p><span class="text-gray-400">User ID:</span> 
                <span [class.text-red-400]="it.userId !== currentUser?.id" class="text-white">{{ it.userId }}</span>
                <span *ngIf="it.userId !== currentUser?.id" class="text-red-400 ml-2">⚠️ MISMATCH!</span>
              </p>
              <p><span class="text-gray-400">Created:</span> <span class="text-white">{{ it.createdAt | date:'medium' }}</span></p>
            </div>
          </div>

          <!-- All Public Itineraries -->
          <div class="bg-gray-800 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-purple-400 mb-2">All Public Itineraries ({{ publicItineraries.length }})</h3>
            <div *ngIf="publicLoading" class="text-gray-400 py-4 text-center">Loading...</div>
            <div *ngFor="let it of publicItineraries" class="border-b border-gray-700 py-2 text-sm">
              <p><span class="text-gray-400">Title:</span> {{ it.title }}</p>
              <p><span class="text-gray-400">User ID:</span> {{ it.userId }}</p>
            </div>
          </div>

          <!-- Storage Debug -->
          <div class="bg-gray-800 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-pink-400 mb-2">LocalStorage</h3>
            <p><span class="text-gray-400">Token:</span> <span class="text-white">{{ hasToken ? '✅ Present' : '❌ Missing' }}</span></p>
            <p><span class="text-gray-400">User Data:</span> <span class="text-white">{{ hasUserData ? '✅ Present' : '❌ Missing' }}</span></p>
            <button (click)="checkLocalStorage()" class="mt-2 bg-gray-700 text-white px-3 py-1 rounded text-sm">
              Log to Console
            </button>
          </div>

          <button (click)="close.emit()" class="w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  `
})
export class DebugItinerariesComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  
  currentUser: any = null;
  myItineraries: any[] = [];
  publicItineraries: any[] = [];
  loading = false;
  publicLoading = false;
  
  debugUserId: string | null = null;
  isAuthenticated = false;
  hasToken = false;
  hasUserData = false;

  constructor(
    private itineraryService: ItineraryService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadItineraries();
  }

  private loadUserData() {
    // Use the public observable
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      this.currentUser = user;
      console.log('Debug - Current user from observable:', user);
    });

    // Use the new helper methods
    this.debugUserId = this.authService.getCurrentUserId();
    this.isAuthenticated = this.authService.isAuthenticated();
    
    // Check localStorage
    this.hasToken = !!localStorage.getItem('token');
    this.hasUserData = !!localStorage.getItem('user');
  }

  loadItineraries() {
    this.loading = true;
    this.publicLoading = true;
    
    // Get user's itineraries
    this.itineraryService.getUserItineraries().subscribe({
      next: (data) => {
        this.myItineraries = data;
        this.loading = false;
        console.log('Debug - User itineraries:', data);
      },
      error: (err) => {
        console.error('Error loading user itineraries:', err);
        this.loading = false;
      }
    });

    // Get public itineraries
    this.itineraryService.getPublicItineraries().subscribe({
      next: (data) => {
        this.publicItineraries = data;
        this.publicLoading = false;
        console.log('Debug - Public itineraries:', data);
      },
      error: (err) => {
        console.error('Error loading public itineraries:', err);
        this.publicLoading = false;
      }
    });
  }

  refresh() {
    this.loadUserData();
    this.loadItineraries();
  }

  checkLocalStorage() {
    console.log('=== LocalStorage Debug ===');
    console.log('Token:', localStorage.getItem('token'));
    console.log('User:', localStorage.getItem('user'));
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Parsed User:', user);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
}