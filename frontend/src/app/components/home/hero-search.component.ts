import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hero-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto glass-effect p-6 rounded-2xl">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="md:col-span-1">
          <label class="block text-sm font-medium text-gray-300 mb-1">Destination</label>
          <select [(ngModel)]="searchData.destination" 
            class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select city</option>
            <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
          <input type="date" [(ngModel)]="searchData.startDate" 
            class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">End Date</label>
          <input type="date" [(ngModel)]="searchData.endDate" 
            class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Travelers</label>
          <input type="number" [(ngModel)]="searchData.travelers" min="1" 
            class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
      </div>
      <button (click)="onSearch()" 
        class="mt-4 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
        Plan My Trip
      </button>
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
export class HeroSearchComponent {
  @Output() search = new EventEmitter<any>();

  cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];
  
  searchData = {
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1
  };

  onSearch() {
    if (this.searchData.destination) {
      this.search.emit(this.searchData);
    }
  }
}