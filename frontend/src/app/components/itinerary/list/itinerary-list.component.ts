import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ItineraryService } from '../../../services/itinerary.service';
import { AuthService } from '../../../services/auth.service';
import { UnsplashService } from '../../../services/unsplash.service';

@Component({
  selector: 'app-itinerary-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="fw-bold">My Itineraries</h2>
        <a routerLink="/planner" class="btn btn-primary">
          <i class="bi bi-plus-lg me-2"></i>Plan New Trip
        </a>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-muted">Loading your itineraries...</p>
      </div>

      <!-- Itineraries Grid -->
      <div *ngIf="!loading" class="row g-4">
        <div *ngFor="let itinerary of itineraries" class="col-md-6 col-lg-4">
          <div class="card h-100 border-0 shadow-sm">
            <div class="position-relative" style="height: 160px; overflow: hidden;">
              <img [src]="itinerary.coverImage" [alt]="itinerary.destination" class="w-100 h-100 object-fit-cover">
              <div class="position-absolute bottom-0 start-0 w-100 p-2" style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                <h5 class="text-white mb-0">{{ itinerary.destination }}</h5>
              </div>
            </div>
            <div class="card-body">
              <p class="text-muted mb-2">
                <i class="bi bi-calendar me-2"></i>
                {{ itinerary.startDate | date:'mediumDate' }} - {{ itinerary.endDate | date:'mediumDate' }}
              </p>
              <p class="text-muted mb-2">
                <i class="bi bi-currency-rupee me-2"></i>
                Budget: {{ itinerary.totalBudget | currency:'INR':'symbol':'1.0-0' }}
              </p>
              <p class="text-muted mb-3">
                <i class="bi bi-tag me-2"></i>
                <span *ngFor="let tag of itinerary.tags" class="badge bg-light text-dark me-1">
                  {{ tag }}
                </span>
              </p>
              <div class="d-flex gap-2">
                <a [routerLink]="['/itinerary', itinerary.id]" class="btn btn-outline-primary btn-sm">
                  <i class="bi bi-eye me-1"></i>View Details
                </a>
                <a [routerLink]="['/itinerary/edit', itinerary.id]" class="btn btn-outline-secondary btn-sm">
                  <i class="bi bi-pencil me-1"></i>Edit
                </a>
              </div>
            </div>
            <div class="card-footer bg-transparent border-0 text-muted small">
              <i class="bi bi-clock me-1"></i>Created: {{ itinerary.createdAt | date:'shortDate' }}
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="itineraries.length === 0" class="col-12 text-center py-5">
          <i class="bi bi-suitcase display-1 text-muted"></i>
          <h3 class="mt-3">No itineraries yet</h3>
          <p class="text-muted">Start planning your first trip!</p>
          <a routerLink="/planner" class="btn btn-primary mt-3">
            <i class="bi bi-plus-lg me-2"></i>Plan a Trip
          </a>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="text-center py-5">
        <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
        <h3 class="mt-3">Oops! Something went wrong</h3>
        <p class="text-muted">{{ error }}</p>
        <button (click)="loadItineraries()" class="btn btn-primary mt-3">
          <i class="bi bi-arrow-repeat me-2"></i>Try Again
        </button>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
    }
    .badge {
      font-weight: normal;
      padding: 0.3rem 0.6rem;
    }
    .object-fit-cover {
      object-fit: cover;
    }
  `]
})
export class ItineraryListComponent implements OnInit {
  itineraries: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private itineraryService: ItineraryService,
    private authService: AuthService,
    private unsplashService: UnsplashService
  ) {}

  ngOnInit() {
    this.loadItineraries();
  }

  loadItineraries() {
    this.loading = true;
    this.error = null;
    
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.error = 'Please login to view your itineraries';
      this.loading = false;
      return;
    }

    // Fetch real itineraries from API
    this.itineraryService.getUserItineraries().subscribe({
      next: (data) => {
        console.log('✅ Itineraries loaded:', data);
        this.itineraries = data;
        this.loadCoverImagesForItineraries();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading itineraries:', error);
        this.error = error.error?.message || 'Failed to load itineraries';
        this.loading = false;
        
        // For development/testing, you can keep mock data as fallback
        if (error.status === 404 || error.status === 500) {
          console.log('Using mock data as fallback');
          this.itineraries = [
            {
              id: '1',
              destination: 'Mumbai',
              startDate: new Date('2024-12-20'),
              endDate: new Date('2024-12-25'),
              totalBudget: 25000,
              tags: ['Adventure', 'Food'],
              createdAt: new Date('2024-12-01')
            },
            {
              id: '2',
              destination: 'Delhi',
              startDate: new Date('2025-01-10'),
              endDate: new Date('2025-01-15'),
              totalBudget: 35000,
              tags: ['Cultural', 'Shopping'],
              createdAt: new Date('2025-01-01')
            }
          ];
          this.loadCoverImagesForItineraries();
        }
      }
    });
  }

  loadCoverImagesForItineraries() {
    this.itineraries.forEach((itinerary) => {
      // Set a temporary placeholder
      itinerary.coverImage = `https://via.placeholder.com/600x400/${this.getColor(itinerary.destination)}/ffffff?text=${itinerary.destination}`;
      
      // Load real city image from Unsplash
      this.unsplashService.getCityImage(itinerary.destination).subscribe({
        next: (url) => {
          itinerary.coverImage = url;
        },
        error: () => {
          // Keep the placeholder - already set
        }
      });
    });
  }

  private getColor(cityName: string): string {
    const colors: Record<string, string> = {
      'Mumbai': '3a86ff',
      'Delhi': '8338ec',
      'Bangalore': 'ff006e',
      'Chennai': 'fb5607',
      'Kolkata': 'ffbe0b',
      'Hyderabad': '3a86ff'
    };
    return colors[cityName] || '3a86ff';
  }
}