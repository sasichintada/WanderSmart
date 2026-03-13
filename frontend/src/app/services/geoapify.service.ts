import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface GeoapifyPlace {
  type: string;
  properties: {
    name: string;
    formatted: string;
    categories: string[];
    place_id: string;
    address_line1?: string;
    address_line2?: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number];
  };
}

@Injectable({
  providedIn: 'root'
})
export class GeoapifyService {
  private apiKey = '20afb38c09db49f48b30d7636507f9b1';
  
  // Use proxy path
  private apiUrl = '/geoapify/places';

  private cityCoordinates: Record<string, { lat: number; lon: number }> = {
    'Mumbai': { lat: 19.0760, lon: 72.8777 },
    'Delhi': { lat: 28.6139, lon: 77.2090 },
    'Bangalore': { lat: 12.9716, lon: 77.5946 },
    'Chennai': { lat: 13.0827, lon: 80.2707 },
    'Kolkata': { lat: 22.5726, lon: 88.3639 },
    'Hyderabad': { lat: 17.3850, lon: 78.4867 }
  };

  constructor(private http: HttpClient) {
    console.log('✅ Geoapify Service initialized with proxy');
  }

  getRestaurants(city: string): Observable<GeoapifyPlace[]> {
    const coords = this.cityCoordinates[city];
    if (!coords) return of([]);

    const url = `${this.apiUrl}?categories=catering.restaurant&filter=circle:${coords.lon},${coords.lat},5000&limit=50&apiKey=${this.apiKey}`;
    
    console.log('🔍 Geoapify URL:', url);
    
    return this.http.get<any>(url).pipe(
      map(response => {
        const features = response.features || [];
        console.log(`✅ Found ${features.length} restaurants`);
        return features;
      }),
      catchError(error => {
        console.error('❌ Geoapify Error:', error);
        return of([]);
      })
    );
  }

  getCafes(city: string): Observable<GeoapifyPlace[]> {
    const coords = this.cityCoordinates[city];
    if (!coords) return of([]);
    const url = `${this.apiUrl}?categories=catering.cafe&filter=circle:${coords.lon},${coords.lat},5000&limit=50&apiKey=${this.apiKey}`;
    return this.http.get<any>(url).pipe(map(r => r.features || []));
  }

  getBars(city: string): Observable<GeoapifyPlace[]> {
    const coords = this.cityCoordinates[city];
    if (!coords) return of([]);
    const url = `${this.apiUrl}?categories=catering.pub,catering.bar&filter=circle:${coords.lon},${coords.lat},5000&limit=50&apiKey=${this.apiKey}`;
    return this.http.get<any>(url).pipe(map(r => r.features || []));
  }

  getShopping(city: string): Observable<GeoapifyPlace[]> {
    const coords = this.cityCoordinates[city];
    if (!coords) return of([]);
    const url = `${this.apiUrl}?categories=commercial.shopping_mall,commercial&filter=circle:${coords.lon},${coords.lat},5000&limit=50&apiKey=${this.apiKey}`;
    return this.http.get<any>(url).pipe(map(r => r.features || []));
  }

  getAttractions(city: string): Observable<GeoapifyPlace[]> {
    const coords = this.cityCoordinates[city];
    if (!coords) return of([]);
    const url = `${this.apiUrl}?categories=tourism.attraction,tourism.sights&filter=circle:${coords.lon},${coords.lat},5000&limit=50&apiKey=${this.apiKey}`;
    return this.http.get<any>(url).pipe(map(r => r.features || []));
  }

  getMuseums(city: string): Observable<GeoapifyPlace[]> {
    const coords = this.cityCoordinates[city];
    if (!coords) return of([]);
    const url = `${this.apiUrl}?categories=entertainment.museum&filter=circle:${coords.lon},${coords.lat},5000&limit=50&apiKey=${this.apiKey}`;
    return this.http.get<any>(url).pipe(map(r => r.features || []));
  }

  getParks(city: string): Observable<GeoapifyPlace[]> {
    const coords = this.cityCoordinates[city];
    if (!coords) return of([]);
    const url = `${this.apiUrl}?categories=leisure.park&filter=circle:${coords.lon},${coords.lat},5000&limit=50&apiKey=${this.apiKey}`;
    return this.http.get<any>(url).pipe(map(r => r.features || []));
  }

  getHotels(city: string): Observable<GeoapifyPlace[]> {
    const coords = this.cityCoordinates[city];
    if (!coords) return of([]);
    const url = `${this.apiUrl}?categories=accommodation.hotel&filter=circle:${coords.lon},${coords.lat},5000&limit=50&apiKey=${this.apiKey}`;
    return this.http.get<any>(url).pipe(map(r => r.features || []));
  }

  getAllPlaces(city: string): Observable<GeoapifyPlace[]> {
    const coords = this.cityCoordinates[city];
    if (!coords) return of([]);
    const url = `${this.apiUrl}?categories=catering,commercial,tourism,entertainment,leisure,accommodation&filter=circle:${coords.lon},${coords.lat},5000&limit=50&apiKey=${this.apiKey}`;
    return this.http.get<any>(url).pipe(map(r => r.features || []));
  }
}