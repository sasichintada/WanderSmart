import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface OsmPlace {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  type: string;
  category: string;
  importance: number;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpenStreetMapService {
  private apiUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  /**
   * Search for places by category in a city
   */
  searchPlaces(city: string, category: string, limit: number = 30): Observable<OsmPlace[]> {
    // Map our categories to OpenStreetMap tags
    const categoryMap: Record<string, string> = {
      'restaurant': 'amenity=restaurant',
      'cafe': 'amenity=cafe',
      'bar': 'amenity=bar',
      'pub': 'amenity=pub',
      'shopping': 'shop=*',
      'mall': 'shop=mall',
      'attraction': 'tourism=attraction',
      'museum': 'tourism=museum',
      'park': 'leisure=park',
      'hotel': 'tourism=hotel',
      'monument': 'historic=monument',
      'temple': 'amenity=place_of_worship',
      'beach': 'natural=beach',
      'market': 'shop=marketplace'
    };

    // Get the OpenStreetMap tag
    const osmTag = categoryMap[category] || categoryMap['attraction'];
    
    // Build query
    const params = new HttpParams()
      .set('q', `[${osmTag}] in ${city}, India`)
      .set('format', 'json')
      .set('addressdetails', '1')
      .set('limit', limit.toString());

    console.log('🔍 Searching OpenStreetMap:', { city, category, osmTag });

    return this.http.get<OsmPlace[]>(this.apiUrl, { params })
      .pipe(
        map(results => {
          console.log(`✅ OpenStreetMap found ${results.length} places`);
          return results;
        }),
        catchError(error => {
          console.error('❌ OpenStreetMap error:', error);
          return of([]);
        })
      );
  }

  /**
   * Get restaurants in a city
   */
  getRestaurants(city: string): Observable<OsmPlace[]> {
    return this.searchPlaces(city, 'restaurant');
  }

  /**
   * Get cafes in a city
   */
  getCafes(city: string): Observable<OsmPlace[]> {
    return this.searchPlaces(city, 'cafe');
  }

  /**
   * Get bars in a city
   */
  getBars(city: string): Observable<OsmPlace[]> {
    return this.searchPlaces(city, 'bar');
  }

  /**
   * Get shopping places in a city
   */
  getShopping(city: string): Observable<OsmPlace[]> {
    return this.searchPlaces(city, 'shopping');
  }

  /**
   * Get attractions in a city
   */
  getAttractions(city: string): Observable<OsmPlace[]> {
    return this.searchPlaces(city, 'attraction');
  }

  /**
   * Get museums in a city
   */
  getMuseums(city: string): Observable<OsmPlace[]> {
    return this.searchPlaces(city, 'museum');
  }

  /**
   * Get parks in a city
   */
  getParks(city: string): Observable<OsmPlace[]> {
    return this.searchPlaces(city, 'park');
  }

  /**
   * Get hotels in a city
   */
  getHotels(city: string): Observable<OsmPlace[]> {
    return this.searchPlaces(city, 'hotel');
  }

  /**
   * Get all places in a city
   */
  getAllPlaces(city: string): Observable<OsmPlace[]> {
    return this.searchPlaces(city, 'attraction');
  }
}