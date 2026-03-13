import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UnsplashService } from './unsplash.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor(private unsplashService: UnsplashService) {}

  /**
   * Get city image URL
   */
  getCityImageUrl(city: string): Observable<string> {
    return this.unsplashService.getCityImage(city);
  }

  /**
   * Get fallback image for a city
   */
  getFallbackImage(city: string): string {
    return this.unsplashService.getCityFallback(city);
  }

  /**
   * Preload images for popular cities
   */
  preloadPopularCitiesImages(cities: string[]): void {
    this.unsplashService.preloadCityImages(cities);
  }
}