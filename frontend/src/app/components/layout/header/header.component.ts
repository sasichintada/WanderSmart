import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg fixed-top glass" [class.bg-white]="!isHome">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2" routerLink="/">
          <i class="bi bi-compass text-primary fs-2"></i>
          <span class="fw-bold fs-4">Wander<span class="text-primary">Smart</span></span>
        </a>

        <button class="navbar-toggler border-0" type="button" (click)="toggleNavbar()">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" [class.show]="!isNavbarCollapsed">
          <ul class="navbar-nav mx-auto">
            <li class="nav-item">
              <a class="nav-link px-4" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeNavbar()">
                Home
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link px-4" routerLink="/planner" routerLinkActive="active" (click)="closeNavbar()">
                Plan Trip
              </a>
            </li>
            <li class="nav-item" *ngIf="isAuthenticated">
              <a class="nav-link px-4" routerLink="/dashboard" routerLinkActive="active" (click)="closeNavbar()">
                Dashboard
              </a>
            </li>
            <li class="nav-item" *ngIf="isAuthenticated">
              <a class="nav-link px-4" routerLink="/itinerary" routerLinkActive="active" (click)="closeNavbar()">
                My Itineraries
              </a>
            </li>
          </ul>

          <div class="d-flex gap-2">
            <ng-container *ngIf="!isAuthenticated">
              <a routerLink="/login" class="btn btn-outline-primary rounded-pill px-4" (click)="closeNavbar()">Login</a>
              <a routerLink="/register" class="btn btn-primary rounded-pill px-4" (click)="closeNavbar()">Register</a>
            </ng-container>

            <ng-container *ngIf="isAuthenticated">
              <div class="dropdown" #userDropdown>
                <button class="btn btn-link text-decoration-none p-0" type="button" (click)="toggleDropdown($event)">
                  <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle bg-primary d-flex align-items-center justify-content-center" 
                         style="width: 40px; height: 40px;">
                      <span class="text-white fw-bold">{{ getUserInitials() }}</span>
                    </div>
                    <span class="d-none d-md-block">{{ user?.username || 'User' }}</span>
                    <i class="bi bi-chevron-down small"></i>
                  </div>
                </button>
                
                <div class="dropdown-menu dropdown-menu-end mt-2" 
                     [class.show]="isDropdownOpen"
                     style="position: absolute; inset: 0px 0px auto auto; margin: 0px; transform: translate(0px, 42px);"
                     (click)="closeDropdown()">
                  <a class="dropdown-item" routerLink="/dashboard" (click)="closeDropdown(); closeNavbar()">
                    <i class="bi bi-person me-2"></i>Dashboard
                  </a>
                  <a class="dropdown-item" routerLink="/itinerary" (click)="closeDropdown(); closeNavbar()">
                    <i class="bi bi-suitcase me-2"></i>My Trips
                  </a>
                  <div class="dropdown-divider"></div>
                  <a class="dropdown-item text-danger" href="#" (click)="logout($event)">
                    <i class="bi bi-box-arrow-right me-2"></i>Logout
                  </a>
                </div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </nav>
    <div style="height: 80px;"></div>
  `,
  styles: [`
    .navbar {
      transition: all 0.3s ease;
      z-index: 1000;
    }
    .nav-link {
      font-weight: 500;
      transition: all 0.2s ease;
      border-radius: 30px;
    }
    .nav-link:hover, .nav-link.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
    }
    .glass {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 20px rgba(0,0,0,0.1);
    }
    .dropdown-menu {
      background: white;
      border: none;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      border-radius: 10px;
      display: block;
      visibility: hidden;
      opacity: 0;
      transition: all 0.2s;
    }
    .dropdown-menu.show {
      visibility: visible;
      opacity: 1;
    }
    .dropdown-item {
      padding: 8px 20px;
      transition: all 0.2s;
      cursor: pointer;
    }
    .dropdown-item:hover {
      background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
    }
    .btn-link {
      text-decoration: none;
      color: inherit;
    }
    .btn-link:hover {
      color: #667eea;
    }
  `]
})
export class HeaderComponent implements OnInit {
  isAuthenticated = false;
  user: any = null;
  isNavbarCollapsed = true;
  isDropdownOpen = false;
  isHome = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.router.events.subscribe(() => {
      this.isHome = this.router.url === '/';
      this.closeDropdown();
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isDropdownButton = target.closest('.btn-link');
    
    if (!isDropdownButton && this.isDropdownOpen) {
      this.closeDropdown();
    }
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.user = user;
    });
  }

  toggleNavbar() {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }

  closeNavbar() {
    this.isNavbarCollapsed = true;
  }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  getUserInitials(): string {
    if (this.user?.username) {
      return this.user.username.charAt(0).toUpperCase();
    }
    return 'U';
  }

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout();
    this.closeDropdown();
    this.closeNavbar();
  }
}