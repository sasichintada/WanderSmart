import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-itinerary-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              <h2 class="fw-bold mb-4">Edit Itinerary</h2>
              
              <form (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label class="form-label">Destination</label>
                  <select class="form-control" [(ngModel)]="itinerary.destination" name="destination" required>
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

                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary">Update Itinerary</button>
                  <a [routerLink]="['/itinerary', itineraryId]" class="btn btn-outline-secondary">Cancel</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ItineraryEditComponent implements OnInit {
  cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];
  itineraryId: string | null = null;
  
  itinerary = {
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    budget: 5000
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.itineraryId = this.route.snapshot.paramMap.get('id');
    // TODO: Load itinerary from API
    this.itinerary = {
      destination: 'Mumbai',
      startDate: '2024-12-20',
      endDate: '2024-12-25',
      travelers: 2,
      budget: 25000
    };
  }

  onSubmit() {
    // TODO: Update via API
    console.log('Updating itinerary:', this.itinerary);
    this.router.navigate(['/itinerary', this.itineraryId]);
  }
}