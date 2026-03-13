import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsResponse {
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  total_results: number;
  next_page: string;
}

@Injectable({
  providedIn: 'root'
})
export class PexelsService {
  private apiKey = environment.pexelsApiKey;
  private apiUrl = 'https://api.pexels.com/v1';

  // Cache for images to avoid repeated API calls
  private imageCache: Map<string, string> = new Map();

  constructor(private http: HttpClient) {
    console.log('Pexels Service initialized with API key');
  }

  /**
   * Get a REAL unique photo for any place
   */
  getPlaceImage(placeName: string, category: string, city: string = 'Mumbai'): Observable<string> {
    // Create a cache key
    const cacheKey = `${placeName}-${category}-${city}`;
    
    // Return cached image if exists
    if (this.imageCache.has(cacheKey)) {
      return of(this.imageCache.get(cacheKey) as string);
    }

    // Build a UNIQUE search query for this specific place
    const searchQuery = this.buildUniqueSearchQuery(placeName, category, city);
    
    console.log(`🔍 Searching Pexels for: "${searchQuery}"`);

    return this.searchImages(searchQuery, 5).pipe(
      map(response => {
        if (response && response.photos && response.photos.length > 0) {
          // Pick a photo based on place name hash to ensure consistency
          const photoIndex = this.getConsistentIndex(placeName, response.photos.length);
          const imageUrl = response.photos[photoIndex].src.medium;
          
          // Cache the result
          this.imageCache.set(cacheKey, imageUrl);
          console.log(`✅ Got unique photo for: ${placeName}`);
          return imageUrl;
        }
        
        // If no results, try a more generic search
        console.log(`⚠️ No photos found for "${searchQuery}", trying fallback`);
        return this.getFallbackImage(placeName, category);
      }),
      catchError(error => {
        console.error('Error fetching image:', error);
        return of(this.getFallbackImage(placeName, category));
      })
    );
  }

  /**
   * Build a UNIQUE search query for each place
   */
  private buildUniqueSearchQuery(placeName: string, category: string, city: string): string {
    // Clean the place name - remove common suffixes
    let cleanName = placeName
      .replace(/road|street|lane|colony|nagar|west|east|north|south|ward|zone|restaurant|hotel|cafe/gi, '')
      .replace(/[0-9]/g, '') // Remove numbers
      .trim();
    
    // If name is too short or generic, use category + city
    if (cleanName.length < 3 || this.isGenericName(cleanName)) {
      // Add variety based on place name hash
      const variety = [
        'restaurant interior', 'restaurant exterior', 'dining', 'food',
        'restaurant building', 'restaurant entrance', 'restaurant night'
      ];
      
      const varietyIndex = this.getConsistentIndex(placeName, variety.length);
      return `${category} ${city} ${variety[varietyIndex]}`;
    }
    
    // Add variety based on place name
    const modifiers = [
      'restaurant', 'hotel', 'shop', 'building',
      'interior', 'exterior', 'dining', 'entrance',
      'facade', 'street view', 'food', 'cuisine'
    ];
    
    const modifierIndex = this.getConsistentIndex(placeName + 'mod', modifiers.length);
    return `${cleanName} ${city} ${modifiers[modifierIndex]}`;
  }

  /**
   * Check if name is generic
   */
  private isGenericName(name: string): boolean {
    const genericNames = ['station', 'road', 'street', 'cross', 'chowk', 'circle', 'square', 'area', 'lane'];
    const lowerName = name.toLowerCase();
    return genericNames.some(g => lowerName.includes(g));
  }

  /**
   * Get consistent index based on string hash
   */
  private getConsistentIndex(str: string, max: number): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % max;
  }

  /**
   * Search Pexels API
   */
  searchImages(query: string, perPage: number = 5): Observable<PexelsResponse> {
    const headers = new HttpHeaders({
      'Authorization': this.apiKey
    });

    return this.http.get<PexelsResponse>(`${this.apiUrl}/search`, {
      headers,
      params: {
        query: query,
        per_page: perPage.toString(),
        orientation: 'landscape'
      }
    }).pipe(
      map(response => {
        console.log(`📸 Found ${response.photos?.length || 0} images for: ${query}`);
        return response;
      }),
      catchError(error => {
        console.error('Pexels API error:', error);
        return of({ photos: [], page: 1, per_page: perPage, total_results: 0, next_page: '' });
      })
    );
  }

  /**
 * Get fallback image - can be called with 1 or 2 arguments
 */
getFallbackImage(placeNameOrCategory: string, category?: string): string {
  if (category) {
    // Called with 2 arguments (placeName, category)
    const seed = this.getConsistentIndex(placeNameOrCategory, 1000);
    return `https://via.placeholder.com/600x400/3a86ff/ffffff?text=${encodeURIComponent(placeNameOrCategory.substring(0, 20))}`;
  } else {
    // Called with 1 argument (category only)
    return `https://via.placeholder.com/600x400/3a86ff/ffffff?text=${encodeURIComponent(placeNameOrCategory)}`;
  }
}
  /**
   * Public method for component to get fallback
   */
  getFallbackByCategory(category: string): string {
    return `https://via.placeholder.com/600x400/3a86ff/ffffff?text=${encodeURIComponent(category)}`;
  }
}