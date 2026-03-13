import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// ============== EXPORT ALL INTERFACES ==============

export interface Itinerary {
  id?: string;
  userId: string;
  userName?: string;
  title: string;
  destination: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  duration?: number;
  totalBudget: number;
  budgetLevel: string;
  travelStyle: string;
  days?: ItineraryDay[];
  tags: string[];
  isPublic: boolean;
  views?: number;
  likes?: number;
  createdAt?: Date;
  coverImage?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date: Date;
  theme?: string;
  activities: Activity[];
  notes?: string;
}

export interface Activity {
  id?: string;
  name: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  cost?: number;
  category: string;
  imageUrl?: string;
  isBooked?: boolean;
  bookingReference?: string;
  phone?: string;
  website?: string;
  rating?: number;
  address?: string;
}

export interface CreateItineraryDto {
  title: string;
  destination: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  budgetLevel: string;
  travelStyle: string;
  tags: string[];
  isPublic: boolean;
  days?: ItineraryDay[];  // ADDED: to save the actual itinerary days
}

export interface GenerateItineraryRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  preferences: string[];
}

export interface CityActivity {
  name: string;
  category: string;
  cost: number;
  location: string;
  description?: string;
  startTime?: string;
  endTime?: string;
}

// ============== EXPORT THE SERVICE ==============

@Injectable({
  providedIn: 'root'
})
export class ItineraryService {
  private apiUrl = `${environment.apiUrl}/Itinerary`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('ItineraryService initialized with API URL:', this.apiUrl);
  }

  /**
   * GENERATE ITINERARY - Calls the backend API to fetch REAL places
   */
  generateItinerary(request: GenerateItineraryRequest): Observable<Itinerary> {
    console.log('🚀 Calling backend API to generate itinerary for:', request.destination);
    
    // Get the authentication token
    const token = localStorage.getItem('token');
    
    // Set up headers with authorization
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // Make HTTP POST request to your backend API
    return this.http.post<Itinerary>(`${this.apiUrl}/generate`, request, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all itineraries for the currently authenticated user
   */
  getUserItineraries(): Observable<Itinerary[]> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }
    return this.http.get<Itinerary[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get a single itinerary by ID
   */
  getItinerary(id: string): Observable<Itinerary> {
    return this.http.get<Itinerary>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create a new itinerary
   */
  createItinerary(itineraryData: CreateItineraryDto): Observable<Itinerary> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    
    console.log('Saving itinerary with days:', itineraryData.days?.length || 0);
    
    return this.http.post<Itinerary>(this.apiUrl, itineraryData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update an existing itinerary
   */
  updateItinerary(id: string, itinerary: Partial<Itinerary>): Observable<Itinerary> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    
    return this.http.put<Itinerary>(`${this.apiUrl}/${id}`, itinerary, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete an itinerary
   */
  deleteItinerary(id: string): Observable<void> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get public itineraries
   */
  getPublicItineraries(destination?: string, page: number = 1, pageSize: number = 10): Observable<Itinerary[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (destination) {
      params = params.set('destination', destination);
    }
    
    return this.http.get<Itinerary[]>(`${this.apiUrl}/public`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Like/unlike an itinerary
   */
  likeItinerary(id: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    
    return this.http.post(`${this.apiUrl}/${id}/like`, {}, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse) {
    console.error('Itinerary API Error:', {
      status: error.status,
      message: error.message,
      error: error.error
    });

    let errorMessage = 'An error occurred';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Please login to continue';
    } else if (error.status === 404) {
      errorMessage = 'Resource not found';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check if backend is running.';
    }

    return throwError(() => ({ 
      status: error.status, 
      message: errorMessage,
      error: error.error 
    }));
  }
}