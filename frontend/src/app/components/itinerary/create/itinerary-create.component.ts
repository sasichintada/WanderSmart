import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-itinerary-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              <h2 class="fw-bold mb-4">Create New Itinerary</h2>
              
              <form (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label class="form-label">Destination</label>
                  <select class="form-control" [(ngModel)]="itinerary.destination" name="destination" required>
                    <option value="">Select city</option>
                    <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
                  </select>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Start Date</label>
                    <input type="date" class="form-control" [(ngModel)]="itinerary.startDate" name="startDate" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">End Date</label>
                    <input type="date" class="form-control" [(ngModel)]="itinerary.endDate" name="endDate" required>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Number of Travelers</label>
                  <input type="number" class="form-control" [(ngModel)]="itinerary.travelers" name="travelers" min="1" required>
                </div>

                <div class="mb-3">
                  <label class="form-label">Budget (₹)</label>
                  <input type="number" class="form-control" [(ngModel)]="itinerary.budget" name="budget" min="0" step="1000">
                </div>

                <div class="mb-4">
                  <label class="form-label">Preferences</label>
                  <div class="d-flex flex-wrap gap-2">
                    <span *ngFor="let pref of preferences" 
                          class="badge bg-light text-dark p-3"
                          [class.bg-primary]="selectedPreferences.includes(pref)"
                          [class.text-white]="selectedPreferences.includes(pref)"
                          (click)="togglePreference(pref)"
                          style="cursor: pointer;">
                      {{ pref }}
                    </span>
                  </div>
                </div>

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary">Create Itinerary</button>
                  <a routerLink="/itinerary" class="btn btn-outline-secondary">Cancel</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ItineraryCreateComponent {
  cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];
  preferences = ['Adventure', 'Cultural', 'Food', 'Shopping', 'Relaxation', 'Nightlife'];
  
  itinerary = {
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    budget: 5000
  };

  selectedPreferences: string[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Pre-fill from query params if coming from planner
    this.route.queryParams.subscribe(params => {
      if (params['destination']) this.itinerary.destination = params['destination'];
      if (params['startDate']) this.itinerary.startDate = params['startDate'];
      if (params['endDate']) this.itinerary.endDate = params['endDate'];
      if (params['travelers']) this.itinerary.travelers = parseInt(params['travelers']);
    });
  }

  togglePreference(pref: string) {
    const index = this.selectedPreferences.indexOf(pref);
    if (index === -1) {
      this.selectedPreferences.push(pref);
    } else {
      this.selectedPreferences.splice(index, 1);
    }
  }

  onSubmit() {
    // TODO: Save to API
    console.log('Saving itinerary:', {
      ...this.itinerary,
      preferences: this.selectedPreferences
    });
    this.router.navigate(['/itinerary']);
  }
}