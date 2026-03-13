import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-test-foursquare',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/90 z-50 overflow-auto p-4">
      <div class="max-w-2xl mx-auto bg-gray-900 rounded-xl p-6">
        <h2 class="text-2xl font-bold text-white mb-4">Foursquare API Test</h2>
        
        <div class="space-y-4">
          <button (click)="testApi()" class="bg-blue-600 text-white px-4 py-2 rounded">
            Test API Connection
          </button>

          <div *ngIf="loading" class="text-gray-400">Testing...</div>
          
          <div *ngIf="error" class="bg-red-900/50 p-4 rounded-lg">
            <h3 class="text-red-400 font-bold">Error:</h3>
            <pre class="text-red-300 text-sm mt-2">{{ error | json }}</pre>
          </div>
          
          <div *ngIf="success" class="bg-green-900/50 p-4 rounded-lg">
            <h3 class="text-green-400 font-bold">Success! Found {{ placesCount }} places</h3>
            <div class="mt-4 space-y-2">
              <div *ngFor="let place of samplePlaces" class="bg-gray-800 p-2 rounded">
                {{ place.name }} - {{ place.category }}
              </div>
            </div>
          </div>

          <button (click)="close.emit()" class="w-full mt-4 bg-gray-700 text-white px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  `
})
export class TestFoursquareComponent {
  @Output() close = new EventEmitter<void>();
  
  loading = false;
  error: any = null;
  success = false;
  placesCount = 0;
  samplePlaces: any[] = [];

  constructor(private http: HttpClient) {}

  testApi() {
    this.loading = true;
    this.error = null;
    this.success = false;

    const headers = new HttpHeaders({
      'Authorization': environment.foursquareApiKey,
      'Accept': 'application/json'
    });

    // Test with Mumbai coordinates
    const ll = '19.0760,72.8777';
    
    this.http.get('https://api.foursquare.com/v3/places/search', {
      headers,
      params: {
        ll: ll,
        radius: '5000',
        limit: '5',
        fields: 'fsq_id,name,categories,location,rating'
      }
    }).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
        this.success = true;
        this.placesCount = response.results?.length || 0;
        this.samplePlaces = response.results?.map((r: any) => ({
          name: r.name,
          category: r.categories?.[0]?.name || 'Unknown'
        })) || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.error = {
          status: err.status,
          message: err.message,
          error: err.error
        };
        this.loading = false;
      }
    });
  }
}