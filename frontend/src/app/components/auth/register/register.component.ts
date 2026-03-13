import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 glass-effect p-8 rounded-2xl">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
            Create new account
          </h2>
        </div>
        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()" autocomplete="off">
          <div class="rounded-md shadow-sm space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-300">Username *</label>
              <input 
                id="username" 
                name="username" 
                type="text" 
                required 
                [(ngModel)]="username"
                autocomplete="off"
                placeholder="Choose a username (min 3 characters)"
                class="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm">
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-gray-300">Email *</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                [(ngModel)]="email"
                autocomplete="off"
                placeholder="Enter your email"
                class="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm">
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-300">Password *</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                [(ngModel)]="password"
                autocomplete="new-password"
                placeholder="Create a password (min 6 characters)"
                class="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-300">First Name</label>
                <input 
                  id="firstName" 
                  name="firstName" 
                  type="text" 
                  [(ngModel)]="firstName"
                  autocomplete="off"
                  placeholder="First name"
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm">
              </div>
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-300">Last Name</label>
                <input 
                  id="lastName" 
                  name="lastName" 
                  type="text" 
                  [(ngModel)]="lastName"
                  autocomplete="off"
                  placeholder="Last name"
                  class="appearance-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm">
              </div>
            </div>
          </div>

          <div *ngIf="error" class="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <p class="text-red-500 text-sm text-center">{{ error }}</p>
          </div>
          
          <div *ngIf="success" class="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
            <p class="text-green-500 text-sm text-center">{{ success }}</p>
          </div>

          <div>
            <button type="submit" 
              [disabled]="loading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300">
              <span *ngIf="!loading">Sign up</span>
              <span *ngIf="loading">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            </button>
          </div>

          <div class="text-center">
            <a routerLink="/login" class="text-sm text-blue-400 hover:text-blue-300">
              Already have an account? Sign in
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
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  loading = false;
  error = '';
  success = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Clear any stored form data
    this.username = '';
    this.email = '';
    this.password = '';
    this.firstName = '';
    this.lastName = '';
  }

  onSubmit() {
    if (!this.username || !this.email || !this.password) {
      this.error = 'Please fill in all required fields';
      return;
    }

    if (this.username.length < 3) {
      this.error = 'Username must be at least 3 characters';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.error = 'Please enter a valid email address';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const registerData = {
      username: this.username,
      email: this.email,
      password: this.password,
      firstName: this.firstName || undefined,
      lastName: this.lastName || undefined
    };

    console.log('Attempting registration with:', registerData);

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Registration response:', response);
        this.loading = false;
        this.success = 'Registration successful! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login'], { 
            queryParams: { registered: 'true', email: this.email } 
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.loading = false;
        
        if (error.status === 400) {
          this.error = error.error?.message || 'User with this email or username already exists';
        } else if (error.status === 0) {
          this.error = 'Cannot connect to server. Make sure backend is running on port 5116';
        } else {
          this.error = error.error?.message || 'Registration failed. Please try again.';
        }
      }
    });
  }
}