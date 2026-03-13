import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 glass-effect p-8 rounded-2xl">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p *ngIf="registeredEmail" class="mt-2 text-center text-sm text-green-400">
            ✓ Registration successful! Please login with your credentials
          </p>
        </div>

        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()" autocomplete="off">
          <div class="rounded-md shadow-sm space-y-4">
            <div>
              <label for="usernameOrEmail" class="block text-sm font-medium text-gray-300">
                Username or Email
              </label>
              <input 
                id="usernameOrEmail" 
                name="usernameOrEmail" 
                type="text" 
                required 
                [(ngModel)]="usernameOrEmail"
                autocomplete="off"
                placeholder="Enter your username or email"
                class="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm">
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-300">Password</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                [(ngModel)]="password"
                autocomplete="current-password"
                placeholder="Enter your password"
                class="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm">
            </div>
          </div>

          <div *ngIf="error" class="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <p class="text-red-500 text-sm text-center">{{ error }}</p>
          </div>

          <div>
            <button type="submit" 
              [disabled]="loading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300">
              <span *ngIf="!loading">Sign in</span>
              <span *ngIf="loading">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            </button>
          </div>

          <div class="text-center">
            <a routerLink="/register" class="text-sm text-blue-400 hover:text-blue-300">
              Don't have an account? Sign up
            </a>
          </div>
        </form>
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
export class LoginComponent {
  usernameOrEmail = '';
  password = '';
  loading = false;
  error = '';
  registeredEmail: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Clear any stored form data
    this.usernameOrEmail = '';
    this.password = '';
    
    // Check if user just registered
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true' && params['email']) {
        this.registeredEmail = params['email'];
        this.usernameOrEmail = params['email']; // Pre-fill with email
      }
    });
  }

  onSubmit() {
    // Clear previous errors
    this.error = '';
    
    if (!this.usernameOrEmail || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;

    console.log('Attempting login with username/email:', this.usernameOrEmail);

    this.authService.login(this.usernameOrEmail, this.password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.loading = false;
        
        if (error.status === 0) {
          this.error = 'Cannot connect to server. Make sure backend is running on port 5116';
        } else if (error.status === 401) {
          this.error = 'Invalid username/email or password';
        } else if (error.status === 400) {
          this.error = error.error?.message || 'Invalid login request';
        } else {
          this.error = error.error?.message || 'Login failed. Please try again.';
        }
      }
    });
  }
}