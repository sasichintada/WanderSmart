import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WeatherWidgetComponent } from '../../components/ui/weather-widget.component';
import { TripTimelineComponent } from '../../components/ui/trip-timeline.component';
import { ItineraryService, CreateItineraryDto, GenerateItineraryRequest, ItineraryDay, Activity } from '../../services/itinerary.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, WeatherWidgetComponent, TripTimelineComponent],
  template: `
    <div class="space-y-6">
      <h1 class="text-3xl font-bold">Plan Your Trip</h1>

      <!-- Trip Details Form -->
      <div class="glass-effect p-6 rounded-2xl">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Destination</label>
            <select [(ngModel)]="tripDetails.destination" 
              (change)="updateTitle()"
              class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="">Select city</option>
              <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
            <input 
              type="date" 
              [(ngModel)]="tripDetails.startDate" 
              (change)="onStartDateChange()"
              [min]="today"
              class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              [class.border-red-500]="startDateInvalid">
            <p *ngIf="startDateInvalid" class="text-red-500 text-xs mt-1">Start date cannot be in the past</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">End Date</label>
            <input 
              type="date" 
              [(ngModel)]="tripDetails.endDate" 
              (change)="onEndDateChange()"
              [min]="tripDetails.startDate || today"
              class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              [class.border-red-500]="endDateInvalid">
            <p *ngIf="endDateInvalid" class="text-red-500 text-xs mt-1">End date must be after start date</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Travelers</label>
            <input type="number" [(ngModel)]="tripDetails.travelers" min="1" 
              class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Budget (₹)</label>
          <input type="number" [(ngModel)]="tripDetails.budget" min="0" step="1000"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Preferences</label>
          <div class="flex flex-wrap gap-2">
            <button *ngFor="let pref of preferences" 
              type="button"
              (click)="togglePreference(pref)"
              [class]="'px-3 py-1 rounded-lg transition-all duration-300 ' + 
                (selectedPreferences.includes(pref) ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')">
              {{ pref }}
            </button>
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Trip Title</label>
          <input type="text" [(ngModel)]="tripTitle" 
            placeholder="e.g., Summer Vacation in Delhi"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
        </div>

        <button (click)="generateItinerary()" 
          [disabled]="isGenerating || !isFormValid()"
          class="mt-6 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50">
          {{ isGenerating ? 'Generating...' : 'Generate Itinerary' }}
        </button>
      </div>

      <!-- Suggested Itinerary -->
      <div *ngIf="showItinerary" class="space-y-6">
        <h2 class="text-2xl font-semibold">Your Personalized Itinerary</h2>
        
        <app-trip-timeline [days]="itineraryDays"></app-trip-timeline>

        <!-- Save Button -->
        <div class="flex gap-4">
          <button (click)="saveItinerary()" 
            [disabled]="saving"
            class="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 disabled:opacity-50">
            <span *ngIf="!saving">Save Itinerary</span>
            <span *ngIf="saving">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          </button>
          <button (click)="regenerateItinerary()" 
            class="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300">
            Regenerate
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isGenerating" class="glass-effect p-12 text-center rounded-2xl">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p class="mt-4 text-gray-300">Generating your personalized itinerary...</p>
        <p class="text-sm text-gray-500">Fetching real places in {{ tripDetails.destination }}...</p>
      </div>

      <!-- Success Message -->
      <div *ngIf="showSuccess" class="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in">
        ✅ Itinerary saved successfully!
      </div>
    </div>
  `,
  styles: [`
    .glass-effect {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class PlannerComponent {
  cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];
  preferences = ['Adventure', 'Cultural', 'Food', 'Shopping', 'Relaxation', 'Nightlife'];
  
  tripDetails = {
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    budget: 5000
  };

  tripTitle = '';
  selectedPreferences: string[] = [];
  showItinerary = false;
  showSuccess = false;
  saving = false;
  isGenerating = false;
  itineraryDays: any[] = [];

  // Date validation properties
  today: string = new Date().toISOString().split('T')[0];
  startDateInvalid = false;
  endDateInvalid = false;

  // Store the full itinerary from backend
  private generatedItinerary: any = null;

  constructor(
    private router: Router,
    private itineraryService: ItineraryService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.setDefaultDates();
  }

  private setDefaultDates() {
    const today = new Date();
    this.tripDetails.startDate = today.toISOString().split('T')[0];
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    this.tripDetails.endDate = endDate.toISOString().split('T')[0];
    
    this.tripDetails.destination = 'Mumbai';
    this.updateTitle();
  }

  onStartDateChange() {
    // Check if start date is in the past
    const selectedDate = new Date(this.tripDetails.startDate);
    const todayDate = new Date(this.today);
    todayDate.setHours(0, 0, 0, 0);
    
    this.startDateInvalid = selectedDate < todayDate;
    
    // If start date is invalid, reset it to today
    if (this.startDateInvalid) {
      this.tripDetails.startDate = this.today;
      this.startDateInvalid = false;
      this.toastService.warning('Start date cannot be in the past');
    }
    
    // If end date is before start date, update end date
    if (this.tripDetails.endDate && this.tripDetails.endDate < this.tripDetails.startDate) {
      this.tripDetails.endDate = this.tripDetails.startDate;
      this.endDateInvalid = false;
    }
    
    this.updateTitle();
  }

  onEndDateChange() {
    // Check if end date is before start date
    this.endDateInvalid = this.tripDetails.endDate < this.tripDetails.startDate;
    
    if (this.endDateInvalid) {
      this.tripDetails.endDate = this.tripDetails.startDate;
      this.endDateInvalid = false;
      this.toastService.warning('End date must be after start date');
    }
  }

  private getBudgetLevel(budget: number): string {
    if (budget < 10000) return 'Low';
    if (budget < 50000) return 'Medium';
    if (budget < 100000) return 'High';
    return 'Luxury';
  }

  private getTravelStyle(): string {
    if (this.selectedPreferences.includes('Adventure')) return 'Adventure';
    if (this.selectedPreferences.includes('Relaxation')) return 'Relaxation';
    if (this.selectedPreferences.includes('Cultural')) return 'Cultural';
    if (this.selectedPreferences.includes('Shopping')) return 'Shopping';
    if (this.selectedPreferences.includes('Food')) return 'Dining';
    if (this.selectedPreferences.includes('Nightlife')) return 'Entertainment';
    return 'Adventure';
  }

  togglePreference(pref: string) {
    const index = this.selectedPreferences.indexOf(pref);
    if (index === -1) {
      this.selectedPreferences.push(pref);
    } else {
      this.selectedPreferences.splice(index, 1);
    }
    this.updateTitle();
  }

  updateTitle() {
    if (this.tripDetails.destination && this.selectedPreferences.length > 0) {
      this.tripTitle = `${this.tripDetails.destination} ${this.selectedPreferences[0]} Trip`;
    } else if (this.tripDetails.destination) {
      this.tripTitle = `${this.tripDetails.destination} Vacation`;
    }
  }

  isFormValid(): boolean {
    // Check if start date is in the past
    const selectedDate = new Date(this.tripDetails.startDate);
    const todayDate = new Date(this.today);
    todayDate.setHours(0, 0, 0, 0);
    
    const startValid = this.tripDetails.startDate && selectedDate >= todayDate;
    const endValid = this.tripDetails.endDate && this.tripDetails.endDate >= this.tripDetails.startDate;
    
    return !!(
      this.tripDetails.destination &&
      startValid &&
      endValid &&
      this.tripDetails.travelers >= 1 &&
      this.tripDetails.budget >= 1000
    );
  }

  generateItinerary() {
    if (!this.tripDetails.destination || !this.tripDetails.startDate || !this.tripDetails.endDate) {
      this.toastService.warning('Please fill in all required fields');
      return;
    }

    if (!this.isFormValid()) {
      this.toastService.warning('Please check your dates');
      return;
    }

    if (!this.tripTitle) {
      this.tripTitle = `${this.tripDetails.destination} Trip`;
    }

    this.isGenerating = true;
    this.showItinerary = false;

    const request: GenerateItineraryRequest = {
      destination: this.tripDetails.destination,
      startDate: this.tripDetails.startDate,
      endDate: this.tripDetails.endDate,
      travelers: this.tripDetails.travelers,
      budget: this.tripDetails.budget,
      preferences: this.selectedPreferences.length > 0 ? this.selectedPreferences : ['Cultural', 'Food']
    };

    console.log('🚀 Calling backend API to generate itinerary:', request);

    this.itineraryService.generateItinerary(request).subscribe({
      next: (itinerary) => {
        console.log('✅ Itinerary received from backend:', itinerary);
        this.generatedItinerary = itinerary;
        this.itineraryDays = this.convertToTimelineFormat(itinerary.days || []);
        this.showItinerary = true;
        this.isGenerating = false;
        this.toastService.success('Itinerary generated successfully!');
      },
      error: (error) => {
        console.error('❌ Failed to generate itinerary:', error);
        this.isGenerating = false;
        this.toastService.error('Failed to generate itinerary: ' + (error.message || 'Unknown error'));
      }
    });
  }

  private convertToTimelineFormat(days: any[]): any[] {
    return days.map(day => ({
      day: day.dayNumber,
      date: new Date(day.date),
      theme: day.theme,
      activities: (day.activities || []).map((activity: any) => ({
        time: activity.startTime || '09:00',
        title: activity.name,
        description: activity.description || '',
        category: activity.category || 'Sightseeing',
        cost: activity.cost || 0,
        location: activity.location || '',
        rating: activity.rating || null
      }))
    }));
  }

  regenerateItinerary() {
    this.generateItinerary();
  }

  saveItinerary() {
    if (!this.authService.isAuthenticated()) {
      this.toastService.warning('Please login to save itineraries');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.showItinerary || this.itineraryDays.length === 0) {
      this.toastService.warning('Please generate an itinerary first');
      return;
    }

    this.saving = true;

    // Format the days properly for saving
    const formattedDays: ItineraryDay[] = this.itineraryDays.map(day => {
      const dayActivities: Activity[] = day.activities.map((activity: any) => ({
        name: activity.title || 'Activity',
        description: activity.description || '',
        startTime: activity.time || '09:00',
        endTime: this.addHours(activity.time || '09:00', 2),
        location: activity.location || activity.title || 'Location',
        latitude: activity.latitude || 0,
        longitude: activity.longitude || 0,
        cost: activity.cost || 0,
        category: activity.category || 'Sightseeing',
        imageUrl: activity.imageUrl || '',
        isBooked: false
      }));

      return {
        dayNumber: day.day,
        date: new Date(day.date),
        theme: day.theme || 'Exploration',
        activities: dayActivities,
        notes: `Day ${day.day} in ${this.tripDetails.destination}`
      };
    });

    const itineraryData: CreateItineraryDto = {
      title: this.tripTitle || `${this.tripDetails.destination} Trip`,
      destination: this.tripDetails.destination,
      description: `${this.tripDetails.destination} trip with focus on ${this.selectedPreferences.join(', ') || 'sightseeing'}`,
      startDate: new Date(this.tripDetails.startDate),
      endDate: new Date(this.tripDetails.endDate),
      totalBudget: this.tripDetails.budget,
      budgetLevel: this.getBudgetLevel(this.tripDetails.budget),
      travelStyle: this.getTravelStyle(),
      tags: this.selectedPreferences.length ? this.selectedPreferences : ['general'],
      isPublic: false,
      days: formattedDays
    };

    this.itineraryService.createItinerary(itineraryData).subscribe({
      next: (savedItinerary) => {
        console.log('✅ Itinerary saved successfully:', savedItinerary);
        this.saving = false;
        this.showSuccess = true;
        this.toastService.success('Itinerary saved successfully!');
        
        setTimeout(() => {
          this.showSuccess = false;
          if (savedItinerary.id) {
            this.router.navigate(['/itinerary', savedItinerary.id]);
          }
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error saving itinerary:', error);
        this.saving = false;
        const errorMsg = error.error?.message || error.message || 'Unknown error';
        this.toastService.error('Failed to save itinerary: ' + errorMsg);
      }
    });
  }

  private addHours(time: string, hours: number): string {
    if (!time) return '11:00';
    const [hour, minute] = time.split(':').map(Number);
    const newHour = (hour + hours) % 24;
    return `${newHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
}