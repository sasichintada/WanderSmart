import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MapComponent } from '../../shared/map/map.component';
import { WeatherWidgetComponent } from '../../ui/weather-widget.component';
import { TripTimelineComponent } from '../../ui/trip-timeline.component';
import { WeatherService } from '../../../services/weather.service';
import { UnsplashService } from '../../../services/unsplash.service';
import { LeafletMapService } from '../../../services/leaflet-map.service';
import { GeoapifyService, GeoapifyPlace } from '../../../services/geoapify.service';
import { Place, Weather, TravelOption } from '../../../models/place.model';

// Import helper functions
import { formatDistance as formatDistanceFn, getPriceLevelString as getPriceLevelStringFn, getCategoryIcon as getCategoryIconFn } from '../../../models/place.model';

@Component({
  selector: 'app-city-details',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MapComponent, 
    WeatherWidgetComponent, 
    TripTimelineComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header with City Name -->
      <div class="flex justify-between items-center">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          {{ cityName }}
        </h1>
        <button (click)="createItinerary()" 
          class="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
          Create Itinerary
        </button>
      </div>

      <!-- Weather Widget -->
      <app-weather-widget [weather]="weather" *ngIf="weather"></app-weather-widget>
      <div *ngIf="weatherLoading" class="glass-effect p-4 rounded-2xl text-center">
        Loading weather data...
      </div>

      <!-- Map -->
      <div class="glass-effect p-4 rounded-2xl">
        <h2 class="text-xl font-semibold mb-4">Explore {{ cityName }}</h2>
        <app-map [places]="places" [center]="mapCenter"></app-map>
      </div>

      <!-- Category Filters -->
      <div class="glass-effect p-4 rounded-2xl">
        <div class="flex flex-wrap gap-2">
          <button *ngFor="let category of categories" 
            (click)="filterByCategory(category.id)"
            [class]="'px-4 py-2 rounded-lg transition-all duration-300 ' + 
              (selectedCategory === category.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')">
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Places Grid -->
      <div class="glass-effect p-6 rounded-2xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Nearby Places</h2>
          <div class="text-sm text-gray-400">
            {{ places.length }} places found
          </div>
        </div>

        <div *ngIf="placesLoading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p class="mt-2 text-gray-400">Loading places...</p>
        </div>

        <div *ngIf="!placesLoading && places.length === 0" class="text-center py-8 text-gray-400">
          No places found. Try adjusting your filters.
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let place of places" class="glass-effect p-4 rounded-xl hover:scale-105 transition-all duration-300">
            <img [src]="place.photoUrl" 
                 [alt]="place.name" 
                 class="w-full h-40 object-cover rounded-lg mb-3"
                 (error)="place.photoUrl = getFallbackImage(place.category, place.name, place.id)">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold">{{ place.name }}</h3>
              <span class="text-xl">{{ getCategoryIcon(place.category) }}</span>
            </div>
            <p class="text-sm text-gray-400">{{ place.category }}</p>
            <p class="text-xs text-gray-500 truncate">{{ place.address }}</p>
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center">
                <span class="text-sm">⭐ {{ place.rating || 'N/A' }}</span>
                <span class="text-sm ml-2">{{ getPriceLevelString(place.priceLevel) }}</span>
              </div>
              <span class="text-sm text-gray-400">{{ formatDistance(place.distance) }}</span>
            </div>
            <button (click)="getTravelOptions(place)" 
              class="mt-3 w-full px-3 py-1 bg-blue-600/50 hover:bg-blue-600 text-white text-sm rounded-lg transition-all duration-300">
              Get Directions
            </button>
          </div>
        </div>
      </div>

      <!-- Travel Options Modal -->
      <div *ngIf="selectedPlace" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" (click)="selectedPlace = null">
        <div class="glass-effect p-6 rounded-2xl max-w-md w-full mx-4" (click)="$event.stopPropagation()">
          <h3 class="text-xl font-semibold mb-4">Travel to {{ selectedPlace.name }}</h3>
          <div *ngIf="travelOptionsLoading" class="text-center py-4">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p class="mt-2 text-gray-400">Getting estimates...</p>
          </div>
          <div *ngIf="!travelOptionsLoading" class="space-y-3">
            <div *ngFor="let option of travelOptions" class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div>
                <div class="font-medium">{{ option.provider }} - {{ option.vehicleType || option.type }}</div>
                <div class="text-sm text-gray-400">{{ formatDuration(option.duration) }} • {{ formatDistance(option.distance * 1000) }}</div>
              </div>
              <div class="text-lg font-semibold">₹{{ option.price }}</div>
            </div>
            <div *ngIf="travelOptions.length === 0" class="text-center text-gray-400 py-4">
              No travel options available
            </div>
          </div>
          <button (click)="selectedPlace = null" 
            class="mt-4 w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-300">
            Close
          </button>
        </div>
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
export class CityDetailsComponent implements OnInit {
  cityName = '';
  places: Place[] = [];
  weather: Weather | null = null;
  weatherLoading = false;
  placesLoading = false;
  travelOptionsLoading = false;
  
  categories = [
    { id: '', name: 'All' },
    { id: 'restaurant', name: 'Restaurants' },
    { id: 'cafe', name: 'Cafes' },
    { id: 'bar', name: 'Bars' },
    { id: 'shopping', name: 'Shopping' },
    { id: 'attraction', name: 'Attractions' },
    { id: 'museum', name: 'Museums' },
    { id: 'park', name: 'Parks' },
    { id: 'hotel', name: 'Hotels' }
  ];
  
  selectedCategory = '';
  mapCenter: [number, number] = [19.0760, 72.8777];
  selectedPlace: Place | null = null;
  travelOptions: TravelOption[] = [];

  // City coordinates for Indian cities
  private cityCoordinates: Record<string, [number, number]> = {
    'Mumbai': [19.0760, 72.8777],
    'Delhi': [28.6139, 77.2090],
    'Bangalore': [12.9716, 77.5946],
    'Chennai': [13.0827, 80.2707],
    'Kolkata': [22.5726, 88.3639],
    'Hyderabad': [17.3850, 78.4867]
  };

  // Mock data for testing (kept but not exposed in UI)
  private mockPlaces: Place[] = [
    {
      id: 'mock1',
      name: 'Gateway of India',
      category: 'Attractions',
      address: 'Apollo Bandar, Colaba, Mumbai',
      latitude: 18.9220,
      longitude: 72.8347,
      rating: 4.8,
      priceLevel: 2,
      distance: 500
    },
    {
      id: 'mock2',
      name: 'Marine Drive',
      category: 'Attractions',
      address: 'Marine Lines, Mumbai',
      latitude: 18.9440,
      longitude: 72.8230,
      rating: 4.7,
      priceLevel: 1,
      distance: 1200
    },
    {
      id: 'mock3',
      name: 'Leopold Cafe',
      category: 'Restaurants',
      address: 'Colaba, Mumbai',
      latitude: 18.9228,
      longitude: 72.8324,
      rating: 4.6,
      priceLevel: 2,
      distance: 600
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private geoapifyService: GeoapifyService,
    private weatherService: WeatherService,
    private unsplashService: UnsplashService,
    private mapService: LeafletMapService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params: any) => {
      this.cityName = params['name'];
      this.loadCityData();
      this.loadWeather();
      this.loadPlaces();
    });
  }

  private loadCityData() {
    this.mapCenter = this.cityCoordinates[this.cityName] || [19.0760, 72.8777];
  }

  private loadWeather() {
    this.weatherLoading = true;
    this.weatherService.getCurrentWeather(this.cityName).subscribe({
      next: (data: any) => {
        this.weather = {
          temp: data.main.temp,
          feelsLike: data.main.feels_like,
          humidity: data.main.humidity,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          windSpeed: data.wind.speed,
          pressure: data.main.pressure,
          visibility: data.visibility,
          sunrise: data.sys.sunrise,
          sunset: data.sys.sunset,
          timezone: data.timezone
        };
        this.weatherLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading weather:', error);
        this.weatherLoading = false;
        this.weather = {
          temp: 28,
          feelsLike: 30,
          humidity: 65,
          description: 'Partly cloudy',
          icon: '02d',
          windSpeed: 12
        };
      }
    });
  }

  private loadPlaces() {
    this.placesLoading = true;
    
    console.log(`🔍 Loading places for ${this.cityName}, category: ${this.selectedCategory || 'all'}`);
    
    // Map UI categories to Geoapify methods
    let apiCall: Observable<GeoapifyPlace[]>;
    
    switch(this.selectedCategory) {
      case 'restaurant':
        apiCall = this.geoapifyService.getRestaurants(this.cityName);
        break;
      case 'cafe':
        apiCall = this.geoapifyService.getCafes(this.cityName);
        break;
      case 'bar':
        apiCall = this.geoapifyService.getBars(this.cityName);
        break;
      case 'shopping':
        apiCall = this.geoapifyService.getShopping(this.cityName);
        break;
      case 'attraction':
        apiCall = this.geoapifyService.getAttractions(this.cityName);
        break;
      case 'museum':
        apiCall = this.geoapifyService.getMuseums(this.cityName);
        break;
      case 'park':
        apiCall = this.geoapifyService.getParks(this.cityName);
        break;
      case 'hotel':
        apiCall = this.geoapifyService.getHotels(this.cityName);
        break;
      default:
        apiCall = this.geoapifyService.getAllPlaces(this.cityName);
    }
    
    apiCall.subscribe({
      next: (results: GeoapifyPlace[]) => {
        console.log(`📦 Received ${results.length} raw places from Geoapify`);
        
        if (results && results.length > 0) {
          // Log the first result to see structure
          console.log('📋 First result:', results[0]);
          
          this.places = this.mapGeoapifyPlacesToPlace(results);
          console.log(`✅ Mapped ${this.places.length} places for ${this.cityName}`);
        } else {
          console.log(`⚠️ No places found for ${this.cityName} - ${this.selectedCategory || 'all'}`);
          this.places = [];
        }
        this.placesLoading = false;
        this.loadImagesForPlaces();
      },
      error: (error: any) => {
        console.error('❌ Error loading places:', error);
        this.placesLoading = false;
        this.places = [];
      }
    });
  }

  private mapGeoapifyPlacesToPlace(geoPlaces: GeoapifyPlace[]): Place[] {
    console.log('🔄 Mapping', geoPlaces.length, 'places');
    
    return geoPlaces.map((place: GeoapifyPlace, index: number) => {
      // Extract a readable category
      let category = 'Attractions';
      const categories = place.properties.categories || [];
      const catStr = categories.join(' ');
      
      if (catStr.includes('catering.restaurant')) category = 'Restaurants';
      else if (catStr.includes('catering.cafe')) category = 'Cafes';
      else if (catStr.includes('catering.pub') || catStr.includes('catering.bar')) category = 'Bars';
      else if (catStr.includes('commercial')) category = 'Shopping';
      else if (catStr.includes('tourism.attraction') || catStr.includes('tourism.sights')) category = 'Attractions';
      else if (catStr.includes('entertainment.museum') || catStr.includes('tourism.museum')) category = 'Museums';
      else if (catStr.includes('leisure.park') || catStr.includes('leisure.garden')) category = 'Parks';
      else if (catStr.includes('accommodation')) category = 'Hotels';
      
      // Get coordinates safely
      let lat = 0, lng = 0;
      if (place.geometry && place.geometry.coordinates) {
        // Geoapify returns [longitude, latitude]
        lng = place.geometry.coordinates[0];
        lat = place.geometry.coordinates[1];
      }
      
      // Calculate distance from city center
      const distance = this.calculateDistanceFromCenter(lat, lng);
      
      // Create a unique ID for each place
      const uniqueId = place.properties.place_id || `place-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the place object
      const mappedPlace: Place = {
        id: uniqueId,
        name: place.properties.name || 'Unknown Place',
        category: category,
        address: place.properties.formatted || place.properties.address_line2 || 'Address not available',
        latitude: lat,
        longitude: lng,
        rating: 4.0 + (Math.random() * 0.9),
        priceLevel: Math.floor(Math.random() * 3) + 1,
        distance: distance
      };
      
      return mappedPlace;
    });
  }

  private calculateDistanceFromCenter(lat: number, lng: number): number {
    const centerLat = this.mapCenter[0];
    const centerLng = this.mapCenter[1];
    
    const R = 6371e3;
    const φ1 = centerLat * Math.PI/180;
    const φ2 = lat * Math.PI/180;
    const Δφ = (lat - centerLat) * Math.PI/180;
    const Δλ = (lng - centerLng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance / 100) * 100;
  }

  private loadImagesForPlaces() {
    this.places.forEach((place: Place) => {
      if (!place.id) {
        place.id = `place-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      this.unsplashService.getPlaceImage(place.name, place.category, this.cityName, place.id).subscribe({
        next: (url: string) => {
          place.photoUrl = url;
          console.log(`✅ Image loaded for: ${place.name} (${this.cityName})`);
        },
        error: (err) => {
          console.error(`❌ Error loading image for ${place.name}:`, err);
          const hash = Math.abs(this.hashCode(place.id + this.cityName)) % 360;
          const hexColor = hash.toString(16).padStart(6, '0');
          place.photoUrl = `https://via.placeholder.com/600x400/${hexColor}/ffffff?text=${encodeURIComponent(place.name.substring(0, 15))}`;
        }
      });
    });
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  filterByCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.loadPlaces();
  }

  getTravelOptions(place: Place) {
    this.selectedPlace = place;
    this.travelOptionsLoading = true;
    this.travelOptions = [];

    setTimeout(() => {
      this.travelOptions = [
        {
          type: 'uber',
          provider: 'Uber',
          vehicleType: 'Uber Go',
          price: Math.floor(Math.random() * 200) + 100,
          duration: Math.floor(Math.random() * 20) + 10,
          distance: place.distance ? place.distance / 1000 : 2
        },
        {
          type: 'ola',
          provider: 'Ola',
          vehicleType: 'Ola Mini',
          price: Math.floor(Math.random() * 180) + 90,
          duration: Math.floor(Math.random() * 25) + 10,
          distance: place.distance ? place.distance / 1000 : 2
        },
        {
          type: 'auto',
          provider: 'Auto Rickshaw',
          price: Math.floor(Math.random() * 100) + 50,
          duration: Math.floor(Math.random() * 30) + 15,
          distance: place.distance ? place.distance / 1000 : 2
        },
        {
          type: 'bus',
          provider: 'City Bus',
          price: Math.floor(Math.random() * 30) + 10,
          duration: Math.floor(Math.random() * 40) + 20,
          distance: place.distance ? place.distance / 1000 : 2
        },
        {
          type: 'metro',
          provider: 'Metro',
          price: Math.floor(Math.random() * 40) + 20,
          duration: Math.floor(Math.random() * 15) + 5,
          distance: place.distance ? place.distance / 1000 : 2
        }
      ];
      this.travelOptionsLoading = false;
    }, 1000);
  }

  createItinerary() {
    this.router.navigate(['/itinerary/create'], {
      queryParams: {
        destination: this.cityName,
        startDate: this.route.snapshot.queryParams['startDate'],
        endDate: this.route.snapshot.queryParams['endDate'],
        travelers: this.route.snapshot.queryParams['travelers']
      }
    });
  }

  // Helper methods exposed to template
  formatDistance(distance?: number): string {
    return formatDistanceFn(distance);
  }

  getPriceLevelString(level?: number): string {
    return getPriceLevelStringFn(level);
  }

  getCategoryIcon(category: string): string {
    return getCategoryIconFn(category);
  }

  formatDuration(minutes?: number): string {
    if (!minutes) return '';
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} hr${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hr ${mins} min`;
  }

  getFallbackImage(category: string, placeName: string = '', placeId: string = ''): string {
    if (placeName && placeId) {
      const uniqueString = `${placeId}-${placeName}-${category}`;
      const hash = Math.abs(this.hashCode(uniqueString)) % 360;
      const hexColor = hash.toString(16).padStart(6, '0');
      return `https://via.placeholder.com/600x400/${hexColor}/ffffff?text=${encodeURIComponent(placeName.substring(0, 15))}`;
    }
    return `https://via.placeholder.com/600x400/cccccc/333333?text=${category}`;
  }
}