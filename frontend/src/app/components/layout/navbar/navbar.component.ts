import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="glass-effect sticky top-0 z-50">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <a routerLink="/" class="flex items-center space-x-2">
            <span class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              WanderSmart
            </span>
          </a>

          <div class="hidden md:flex items-center space-x-8">
            <a routerLink="/" routerLinkActive="text-blue-400" [routerLinkActiveOptions]="{exact: true}" 
               class="text-gray-300 hover:text-white transition-colors">
              Home
            </a>
            <a routerLink="/planner" routerLinkActive="text-blue-400" 
               class="text-gray-300 hover:text-white transition-colors">
              Plan Trip
            </a>
            <a *ngIf="isAuthenticated" routerLink="/dashboard" routerLinkActive="text-blue-400" 
               class="text-gray-300 hover:text-white transition-colors">
              Dashboard
            </a>
            <a *ngIf="isAuthenticated" routerLink="/itinerary" routerLinkActive="text-blue-400" 
               class="text-gray-300 hover:text-white transition-colors">
              My Itineraries
            </a>
          </div>

          <div class="flex items-center space-x-4">
            <ng-container *ngIf="!isAuthenticated; else userMenu">
              <a routerLink="/login" 
                 class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-300">
                Login
              </a>
              <a routerLink="/register" 
                 class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Register
              </a>
            </ng-container>
            <ng-template #userMenu>
              <div class="relative" x-data="{ open: false }">
                <button (click)="toggleMenu()" class="flex items-center space-x-2 focus:outline-none">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span class="text-sm font-medium">{{ username?.charAt(0) || 'U' }}</span>
                  </div>
                </button>
                <div *ngIf="isMenuOpen" class="absolute right-0 mt-2 w-48 glass-effect rounded-lg shadow-lg py-1">
                  <a routerLink="/dashboard" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10">Dashboard</a>
                  <a routerLink="/itinerary" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10">My Itineraries</a>
                  <a routerLink="/planner" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10">Plan New Trip</a>
                  <hr class="border-gray-600">
                  <button (click)="logout()" class="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10">
                    Logout
                  </button>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .glass-effect {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  `]
})
export class NavbarComponent {
  isMenuOpen = false;
  isAuthenticated = false;
  username: string | null = null;

  constructor(private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.username = user?.username || null;
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.isMenuOpen = false;
  }
}