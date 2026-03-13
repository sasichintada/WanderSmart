import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="glass-effect mt-auto">
      <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-lg font-semibold mb-4">WanderSmart</h3>
            <p class="text-sm text-gray-400">
              Your intelligent travel companion for smarter, better trips.
            </p>
          </div>
          <div>
            <h4 class="text-sm font-semibold mb-4">Quick Links</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a routerLink="/" class="hover:text-white transition-colors">Home</a></li>
              <li><a routerLink="/planner" class="hover:text-white transition-colors">Plan Trip</a></li>
              <li><a routerLink="/dashboard" class="hover:text-white transition-colors">Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold mb-4">Cities</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li>Mumbai</li>
              <li>Delhi</li>
              <li>Bangalore</li>
              <li>Chennai</li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold mb-4">Contact</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li>Email: info&#64;wandersmart.com</li>
              <li>Phone: +91 1234567890</li>
            </ul>
          </div>
        </div>
        <div class="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-gray-400">
          © 2024 WanderSmart. All rights reserved.
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .glass-effect {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
  `]
})
export class FooterComponent {}