import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeroSearchComponent } from './hero-search.component';
import { DestinationCardComponent } from './destination-card.component';
import { ImageService } from '../../services/image.service';
import { UnsplashService } from '../../services/unsplash.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroSearchComponent, DestinationCardComponent],
  template: `
    <div class="relative min-h-screen">
      <!-- Animated World Map Background -->
      <div class="fixed inset-0 z-0 opacity-20">
        <canvas #worldMap class="w-full h-full"></canvas>
      </div>

      <!-- Content -->
      <div class="relative z-10">
        <!-- Hero Section -->
        <section class="py-20">
          <div class="text-center mb-12">
            <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
              Plan Your Perfect Journey
            </h1>
            <p class="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover amazing places, get real-time travel info, and create smart itineraries with AI-powered recommendations.
            </p>
          </div>
          
          <app-hero-search (search)="onSearch($event)"></app-hero-search>
        </section>

        <!-- Popular Destinations -->
        <section class="py-16">
          <h2 class="text-3xl font-bold mb-8 text-center">Popular Indian Destinations</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <app-destination-card 
              *ngFor="let city of popularCities"
              [city]="city"
              [imageUrl]="city.image"
              (click)="navigateToCity(city.name)">
            </app-destination-card>
          </div>
        </section>

        <!-- Features -->
        <section class="py-16">
          <h2 class="text-3xl font-bold mb-12 text-center">Why Choose WanderSmart?</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="glass-effect p-6 rounded-2xl text-center">
              <div class="text-4xl mb-4">🌍</div>
              <h3 class="text-xl font-semibold mb-2">Smart Planning</h3>
              <p class="text-gray-400">AI-powered itineraries based on your preferences and budget</p>
            </div>
            <div class="glass-effect p-6 rounded-2xl text-center">
              <div class="text-4xl mb-4">🚗</div>
              <h3 class="text-xl font-semibold mb-2">Real-time Transport</h3>
              <p class="text-gray-400">Live Uber/Ola estimates and booking integration</p>
            </div>
            <div class="glass-effect p-6 rounded-2xl text-center">
              <div class="text-4xl mb-4">🌤️</div>
              <h3 class="text-xl font-semibold mb-2">Live Weather</h3>
              <p class="text-gray-400">Real-time weather updates and forecasts</p>
            </div>
          </div>
        </section>
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
export class HomeComponent implements OnInit, OnDestroy {
  popularCities = [
    { name: 'Mumbai', image: '', places: '45+', rating: 4.8 },
    { name: 'Delhi', image: '', places: '50+', rating: 4.7 },
    { name: 'Bangalore', image: '', places: '35+', rating: 4.6 },
    { name: 'Chennai', image: '', places: '40+', rating: 4.5 },
    { name: 'Kolkata', image: '', places: '40+', rating: 4.6 },
    { name: 'Hyderabad', image: '', places: '35+', rating: 4.7 }
  ];

  private animationFrame: any;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(
    private router: Router,
    private imageService: ImageService,
    private unsplashService: UnsplashService
  ) {}

  ngOnInit() {
    this.initWorldMap();
    this.loadCityImages();
  }

  ngOnDestroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private loadCityImages() {
    this.popularCities.forEach((city) => {
      // Set a temporary colored placeholder first
      city.image = `https://via.placeholder.com/600x400/${this.getColor(city.name)}/ffffff?text=${city.name}`;
      
      // Load real city image from Unsplash
      this.unsplashService.getCityImage(city.name).subscribe({
        next: (url) => {
          city.image = url;
          console.log(`✅ Image loaded for ${city.name}`);
        },
        error: (err) => {
          console.error(`❌ Error loading image for ${city.name}:`, err);
          // Keep the colored placeholder - already set
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

  private initWorldMap() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    this.drawWorldMap();
  }

  private drawWorldMap() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;

    // Draw simple world map outline
    ctx.beginPath();
    
    const points = [
      [0.2, 0.3], [0.25, 0.25], [0.3, 0.2], [0.4, 0.15], [0.5, 0.1],
      [0.6, 0.12], [0.7, 0.15], [0.8, 0.2], [0.85, 0.25], [0.9, 0.3],
      [0.88, 0.4], [0.85, 0.5], [0.8, 0.6], [0.7, 0.7], [0.6, 0.75],
      [0.5, 0.78], [0.4, 0.75], [0.3, 0.7], [0.2, 0.6], [0.15, 0.5],
      [0.12, 0.4], [0.15, 0.35], [0.2, 0.3]
    ];

    ctx.moveTo(points[0][0] * width, points[0][1] * height);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0] * width, points[i][1] * height);
    }
    ctx.closePath();
    ctx.stroke();

    // Add animated dots for cities
    const time = Date.now() / 1000;
    const cities = [
      [0.25, 0.3], [0.35, 0.25], [0.45, 0.2], [0.55, 0.18],
      [0.65, 0.22], [0.75, 0.28], [0.3, 0.4], [0.5, 0.45]
    ];

    cities.forEach((city, i) => {
      const x = city[0] * width;
      const y = city[1] * height;
      const pulse = Math.sin(time * 2 + i) * 0.5 + 0.5;
      
      ctx.beginPath();
      ctx.arc(x, y, 3 + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + pulse * 0.3})`;
      ctx.fill();
    });

    this.animationFrame = requestAnimationFrame(() => this.drawWorldMap());
  }

  onSearch(searchData: any) {
    this.router.navigate(['/city', searchData.destination], { 
      queryParams: { 
        startDate: searchData.startDate,
        endDate: searchData.endDate,
        travelers: searchData.travelers 
      }
    });
  }

  navigateToCity(cityName: string) {
    this.router.navigate(['/city', cityName]);
  }
}