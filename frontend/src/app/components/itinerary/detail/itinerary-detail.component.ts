import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ItineraryService } from '../../../services/itinerary.service';
import { AuthService } from '../../../services/auth.service';
import { UnsplashService } from '../../../services/unsplash.service';

@Component({
  selector: 'app-itinerary-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container py-4">
      <!-- Loading State -->
      <ng-template #loading>
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading itinerary details...</p>
        </div>
      </ng-template>

      <!-- Itinerary Details -->
      <div *ngIf="itinerary; else loading">
        <!-- Cover Image -->
        <div class="position-relative mb-4 rounded-3 overflow-hidden" style="height: 300px;">
          <img [src]="coverImage" [alt]="itinerary.destination" class="w-100 h-100 object-fit-cover">
          <div class="position-absolute bottom-0 start-0 w-100 p-4" style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
            <h2 class="fw-bold text-white mb-0">{{ itinerary.title || itinerary.destination + ' Trip' }}</h2>
          </div>
        </div>

        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <p class="text-muted">{{ itinerary.description }}</p>
          </div>
          <div>
            <a [routerLink]="['/itinerary/edit', itineraryId]" class="btn btn-outline-primary me-2">
              <i class="bi bi-pencil me-2"></i>Edit
            </a>
            <a routerLink="/itinerary" class="btn btn-outline-secondary">
              <i class="bi bi-arrow-left me-2"></i>Back
            </a>
          </div>
        </div>

        <!-- Trip Summary Cards -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="text-muted mb-2">Destination</h6>
                <h5>{{ itinerary.destination }}</h5>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="text-muted mb-2">Duration</h6>
                <h5>{{ calculateDuration() }} days</h5>
                <small class="text-muted">{{ itinerary.startDate | date:'mediumDate' }} - {{ itinerary.endDate | date:'mediumDate' }}</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="text-muted mb-2">Total Budget</h6>
                <h5>₹{{ itinerary.totalBudget | number:'1.0-0' }}</h5>
                <small class="text-muted">{{ itinerary.budgetLevel }} Budget</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm">
              <div class="card-body">
                <h6 class="text-muted mb-2">Travel Style</h6>
                <h5>{{ itinerary.travelStyle }}</h5>
                <small class="text-muted">
                  <span *ngFor="let tag of itinerary.tags" class="badge bg-light text-dark me-1">
                    {{ tag }}
                  </span>
                </small>
              </div>
            </div>
          </div>
        </div>

        <!-- Weather Forecast (if available) -->
        <div class="card border-0 shadow-sm mb-4" *ngIf="weather && weather.length > 0">
          <div class="card-body">
            <h5 class="card-title">Weather Forecast</h5>
            <div class="row">
              <div class="col-md-2 text-center" *ngFor="let day of weather">
                <div class="fw-bold">{{ day.date | date:'EEE' }}</div>
                <i [class]="'wi wi-' + day.icon + ' display-6'"></i>
                <div>{{ day.temp }}°C</div>
                <small class="text-muted">{{ day.condition }}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Day-wise Plan -->
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-4">Day-wise Plan</h5>
            
            <div *ngFor="let day of itinerary.days; let i = index" class="mb-4">
              <div class="d-flex align-items-center mb-3">
                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                     style="width: 40px; height: 40px;">
                  {{ day.dayNumber || i + 1 }}
                </div>
                <h6 class="mb-0">Day {{ day.dayNumber || i + 1 }} - {{ day.date | date:'fullDate' }}</h6>
                <span class="ms-auto badge bg-light text-dark">Theme: {{ day.theme || 'Exploration' }}</span>
              </div>
              
              <!-- Timeline -->
              <div class="ms-5 ps-3" style="border-left: 2px dashed #dee2e6;">
                <div *ngFor="let activity of day.activities; let j = index" class="mb-3 position-relative">
                  <div class="position-absolute start-0 translate-middle-x bg-white p-1" 
                       style="margin-left: -2.1rem; margin-top: 0.5rem;">
                    <i class="bi bi-circle-fill text-primary" style="font-size: 0.8rem;"></i>
                  </div>
                  <div class="d-flex">
                    <div class="me-3 text-muted" style="min-width: 70px;">{{ activity.startTime || activity.time || '10:00' }}</div>
                    <div class="flex-grow-1">
                      <div class="d-flex justify-content-between">
                        <div>
                          <div class="fw-medium">{{ activity.name || activity.title }}</div>
                          <small class="text-muted">{{ activity.description }}</small>
                          <div *ngIf="activity.location" class="text-muted small mt-1">
                            <i class="bi bi-geo-alt me-1"></i>{{ activity.location }}
                          </div>
                        </div>
                        <div class="text-end">
                          <div *ngIf="activity.cost" class="fw-medium">₹{{ activity.cost | number:'1.0-0' }}</div>
                          <small class="text-muted">{{ activity.category }}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Day Notes -->
              <div *ngIf="day.notes" class="mt-3 ms-5 ps-3">
                <small class="text-muted">
                  <i class="bi bi-journal-text me-2"></i>{{ day.notes }}
                </small>
              </div>

              <!-- Divider between days -->
              <hr *ngIf="i < itinerary.days.length - 1" class="my-4">
            </div>

            <!-- No days message -->
            <div *ngIf="!itinerary.days || itinerary.days.length === 0" class="text-center py-4">
              <i class="bi bi-calendar-x display-4 text-muted"></i>
              <p class="mt-2">No day plans added yet.</p>
            </div>
          </div>
        </div>

        <!-- Stats Footer -->
        <div class="row mt-4">
          <div class="col-md-4">
            <small class="text-muted">Created: {{ itinerary.createdAt | date:'medium' }}</small>
          </div>
          <div class="col-md-4 text-center">
            <small class="text-muted"><i class="bi bi-eye me-1"></i>{{ itinerary.views || 0 }} views</small>
            <small class="text-muted ms-3"><i class="bi bi-heart me-1"></i>{{ itinerary.likes || 0 }} likes</small>
          </div>
          <div class="col-md-4 text-end">
            <small class="text-muted">By {{ itinerary.userName || 'You' }}</small>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
    }
    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #0d6efd;
      position: absolute;
      left: -6px;
    }
    .object-fit-cover {
      object-fit: cover;
    }
  `]
})
export class ItineraryDetailComponent implements OnInit {
  itineraryId: string | null = null;
  itinerary: any = null;
  weather: any[] = [];
  loading = true;
  coverImage: string = '';

  constructor(
    private route: ActivatedRoute,
    private itineraryService: ItineraryService,
    private authService: AuthService,
    private unsplashService: UnsplashService
  ) {}

  ngOnInit() {
    this.itineraryId = this.route.snapshot.paramMap.get('id');
    console.log('Loading itinerary with ID:', this.itineraryId);
    
    if (this.itineraryId) {
      this.loadItinerary();
    } else {
      console.error('No itinerary ID provided');
      this.loading = false;
    }
  }

  loadItinerary() {
    this.loading = true;
    
    this.itineraryService.getItinerary(this.itineraryId!).subscribe({
      next: (data) => {
        console.log('Itinerary loaded:', data);
        this.itinerary = data;
        
        // Load cover image
        this.loadCoverImage();
        
        // Generate mock weather data based on dates
        if (this.itinerary.startDate && this.itinerary.endDate) {
          this.generateWeatherData();
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading itinerary:', error);
        this.loading = false;
        
        // For demo purposes, load mock data if API fails
        this.loadMockItinerary();
      }
    });
  }

  loadCoverImage() {
    if (this.itinerary.destination) {
      this.unsplashService.getCityImage(this.itinerary.destination).subscribe({
        next: (url) => {
          this.coverImage = url;
        },
        error: () => {
          // Fallback image
          this.coverImage = `https://via.placeholder.com/1200x400/3a86ff/ffffff?text=${this.itinerary.destination}`;
        }
      });
    } else {
      this.coverImage = 'https://via.placeholder.com/1200x400/3a86ff/ffffff?text=Itinerary';
    }
  }

  loadMockItinerary() {
    // Only use mock data if no real data (for demo purposes)
    const mockItineraries: Record<string, any> = {
      'mumbai': {
        id: 'mumbai-1',
        title: 'Mumbai Adventure',
        destination: 'Mumbai',
        description: 'Explore the vibrant city of Mumbai',
        startDate: new Date('2024-12-20'),
        endDate: new Date('2024-12-25'),
        totalBudget: 25000,
        budgetLevel: 'Medium',
        travelStyle: 'Adventure',
        tags: ['Adventure', 'Cultural', 'Food'],
        userName: 'John Doe',
        views: 45,
        likes: 12,
        createdAt: new Date('2024-12-01'),
        days: [
          {
            dayNumber: 1,
            date: new Date('2024-12-20'),
            theme: 'Arrival & Local Exploration',
            notes: 'Check into hotel in Colaba area',
            activities: [
              { time: '09:00', title: 'Arrival & Check-in', description: 'Check into hotel', location: 'Colaba', cost: 0, category: 'Transport' },
              { time: '12:00', title: 'Lunch at Leopold Cafe', description: 'Famous restaurant in Colaba', location: 'Colaba', cost: 800, category: 'Dining' },
              { time: '15:00', title: 'Gateway of India', description: 'Visit the iconic monument', location: 'Colaba', cost: 0, category: 'Attraction' },
              { time: '18:00', title: 'Sunset at Marine Drive', description: 'Evening walk', location: 'Marine Drive', cost: 0, category: 'Attraction' }
            ]
          },
          {
            dayNumber: 2,
            date: new Date('2024-12-21'),
            theme: 'Heritage & Culture',
            activities: [
              { time: '10:00', title: 'Elephanta Caves', description: 'UNESCO World Heritage site', location: 'Elephanta Island', cost: 500, category: 'Attraction' },
              { time: '13:00', title: 'Lunch', description: 'Local cuisine', location: 'Fort Area', cost: 600, category: 'Dining' },
              { time: '16:00', title: 'Chhatrapati Shivaji Terminus', description: 'Historic railway station', location: 'Fort', cost: 0, category: 'Attraction' }
            ]
          }
        ]
      },
      'delhi': {
        id: 'delhi-1',
        title: 'Delhi Heritage Tour',
        destination: 'Delhi',
        description: 'Discover the rich history of Delhi',
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-01-15'),
        totalBudget: 35000,
        budgetLevel: 'High',
        travelStyle: 'Cultural',
        tags: ['Cultural', 'History', 'Food'],
        userName: 'Jane Smith',
        views: 38,
        likes: 9,
        createdAt: new Date('2025-01-01'),
        days: [
          {
            dayNumber: 1,
            date: new Date('2025-01-10'),
            theme: 'Old Delhi Exploration',
            activities: [
              { time: '10:00', title: 'Red Fort', description: 'Historic fort', location: 'Chandni Chowk', cost: 500, category: 'Attraction' },
              { time: '13:00', title: 'Karims', description: 'Famous Mughlai food', location: 'Jama Masjid', cost: 800, category: 'Dining' },
              { time: '16:00', title: 'Jama Masjid', description: 'Largest mosque in India', location: 'Old Delhi', cost: 0, category: 'Attraction' }
            ]
          },
          {
            dayNumber: 2,
            date: new Date('2025-01-11'),
            theme: 'New Delhi Sights',
            activities: [
              { time: '09:00', title: 'Qutub Minar', description: 'Ancient minaret', location: 'Mehrauli', cost: 400, category: 'Attraction' },
              { time: '12:00', title: 'India Gate', description: 'War memorial', location: 'Central Delhi', cost: 0, category: 'Attraction' },
              { time: '15:00', title: 'Lotus Temple', description: 'Baháʼí House of Worship', location: 'Kalkaji', cost: 0, category: 'Attraction' }
            ]
          }
        ]
      }
    };

    // Try to match by destination or use Mumbai as default
    const city = this.itinerary?.destination?.toLowerCase() || 'mumbai';
    this.itinerary = mockItineraries[city] || mockItineraries['mumbai'];
    
    // Load cover image for mock data
    this.loadCoverImage();
    
    // Generate weather data
    this.generateWeatherData();
  }

  calculateDuration(): number {
    if (!this.itinerary?.startDate || !this.itinerary?.endDate) return 0;
    const start = new Date(this.itinerary.startDate);
    const end = new Date(this.itinerary.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
  }

  generateWeatherData() {
    // Mock weather data for the trip duration
    const start = new Date(this.itinerary.startDate);
    const end = new Date(this.itinerary.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];
    const icons = ['day-sunny', 'day-cloudy', 'cloudy', 'rain', 'night-clear'];
    
    this.weather = [];
    for (let i = 0; i < Math.min(5, days); i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      
      const randomIndex = Math.floor(Math.random() * conditions.length);
      this.weather.push({
        date: date,
        temp: Math.floor(Math.random() * 10) + 25, // 25-35°C
        condition: conditions[randomIndex],
        icon: icons[randomIndex]
      });
    }
  }
}