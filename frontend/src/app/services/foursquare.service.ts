import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FoursquarePlace {
  fsq_place_id: string;
  name: string;
  categories: Array<{
    id: string;
    name: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }>;
  location: {
    address?: string;
    locality?: string;
    postcode?: string;
    region?: string;
    country?: string;
    formatted_address: string;
  };
  latitude: number;
  longitude: number;
  distance?: number;
  rating?: number;
  price?: number;
  photos?: Array<{
    id: string;
    prefix: string;
    suffix: string;
  }>;
  extended_location?: {
    dma?: string;
    census_block?: string;
  };
}

export interface FoursquareResponse {
  results: FoursquarePlace[];
}

// ==================== COMPLETE CATEGORY IDS FOR YOUR APP ====================
export const PLACE_CATEGORIES = {
  // ==================== FOOD & DRINK ====================
  RESTAURANTS: {
    ALL: '13065',
    INDIAN: '15170',
    CHINESE: '15169',
    FAST_FOOD: '13145',
    PIZZA: '13064',
    SEAFOOD: '15172',
    VEGETARIAN: '13377',
  },
  
  CAFES: {
    ALL: '13032',
    COFFEE_SHOP: '13035',
    TEA_HOUSE: '13036',
    BUBBLE_TEA: '13033',
    BAKERY: '13026',
    DESSERT_SHOP: '13029',
    JUICE_BAR: '13047',
  },
  
  BARS: {
    ALL: '13003',
    PUBS: '13389',
    WINE_BAR: '13007',
    COCKTAIL_BAR: '13004',
    BREWERY: '13002',
    SPORTS_BAR: '13006',
  },

  // ==================== SHOPPING ====================
  SHOPPING: {
    ALL: '17114',
    MALL: '17114',
    DEPARTMENT_STORE: '17099',
    CLOTHING_STORE: '17120',
    ELECTRONICS: '17124',
    BOOKSTORE: '17095',
    JEWELRY: '17130',
    MARKET: '17144',
    SUPERMARKET: '17142',
  },

  // ==================== ATTRACTIONS ====================
  ATTRACTIONS: {
    ALL: '16000',
    HISTORICAL: '16018',
    MONUMENTS: '16030',
    SCENIC_LOOKOUTS: '16039',
    CASTLES: '16009',
    TEMPLES: '16115',
    CHURCHES: '16114',
    MOSQUES: '16116',
    BRIDGES: '16003',
  },

  // ==================== MUSEUMS ====================
  MUSEUMS: {
    ALL: '10027',
    ART_MUSEUM: '10024',
    HISTORY_MUSEUM: '10026',
    SCIENCE_MUSEUM: '10031',
    CHILDRENS_MUSEUM: '10025',
  },

  // ==================== PARKS & OUTDOORS ====================
  PARKS: {
    ALL: '16032',
    NATIONAL_PARK: '16036',
    STATE_PARK: '16040',
    GARDEN: '16016',
    BEACH: '16001',
    LAKE: '16024',
    WATERFALL: '16045',
  },

  // ==================== HOTELS ====================
  HOTELS: {
    ALL: '19014',
    HOTEL: '19014',
    RESORT: '19028',
    LUXURY_HOTEL: '19017',
    BUDGET_HOTEL: '19013',
    BED_AND_BREAKFAST: '19008',
    HOSTEL: '19016',
    MOTEL: '19024',
  },
};

@Injectable({
  providedIn: 'root'
})
export class FoursquareService {
  private apiUrl = 'https://api.foursquare.com/v3/places/search';
  private apiKey = environment.foursquareApiKey;

  constructor(private http: HttpClient) {
    console.log('Foursquare Service initialized with new API');
  }

  /**
   * Base search method - can be used with any category IDs
   */
  searchPlaces(
    ll: string,
    radius: number = 5000,
    categoryIds: string = '',
    limit: number = 50
  ): Observable<FoursquarePlace[]> {
    if (!this.apiKey) {
      console.error('Foursquare API key is missing!');
      return of([]);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'X-Places-Api-Version': '2025-06-17'
    });

    let params: any = {
      ll: ll,
      radius: radius,
      limit: limit,
      sort: 'DISTANCE',
      fields: 'fsq_place_id,name,categories,location,latitude,longitude,distance,rating,price,photos,hours,website,tel'
    };

    if (categoryIds) {
      params.categories = categoryIds;
    }

    console.log('Calling Foursquare API with params:', params);

    return this.http.get<FoursquareResponse>(this.apiUrl, { headers, params })
      .pipe(
        map(response => {
          console.log('Foursquare API response:', response);
          return response.results || [];
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Foursquare API error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          return of([]);
        })
      );
  }

  /**
   * Search by specific category (single or multiple IDs)
   */
  searchByCategory(
    ll: string, 
    categoryIds: string, 
    radius: number = 5000, 
    limit: number = 50
  ): Observable<FoursquarePlace[]> {
    return this.searchPlaces(ll, radius, categoryIds, limit);
  }

  /**
   * Get ALL restaurants in an area (multiple types)
   */
  getAllRestaurants(ll: string, radius: number = 5000): Observable<FoursquarePlace[]> {
    const restaurantIds = [
      PLACE_CATEGORIES.RESTAURANTS.ALL,
      PLACE_CATEGORIES.RESTAURANTS.FAST_FOOD,
      PLACE_CATEGORIES.RESTAURANTS.INDIAN,
      PLACE_CATEGORIES.RESTAURANTS.CHINESE,
    ].join(',');
    
    return this.searchByCategory(ll, restaurantIds, radius, 50);
  }

  /**
   * Get ALL cafes in an area
   */
  getAllCafes(ll: string, radius: number = 5000): Observable<FoursquarePlace[]> {
    const cafeIds = [
      PLACE_CATEGORIES.CAFES.ALL,
      PLACE_CATEGORIES.CAFES.COFFEE_SHOP,
      PLACE_CATEGORIES.CAFES.TEA_HOUSE,
      PLACE_CATEGORIES.CAFES.BAKERY,
      PLACE_CATEGORIES.CAFES.DESSERT_SHOP,
      PLACE_CATEGORIES.CAFES.JUICE_BAR,
    ].join(',');
    
    return this.searchByCategory(ll, cafeIds, radius, 50);
  }

  /**
   * Get ALL bars in an area
   */
  getAllBars(ll: string, radius: number = 5000): Observable<FoursquarePlace[]> {
    const barIds = [
      PLACE_CATEGORIES.BARS.ALL,
      PLACE_CATEGORIES.BARS.PUBS,
      PLACE_CATEGORIES.BARS.WINE_BAR,
      PLACE_CATEGORIES.BARS.COCKTAIL_BAR,
      PLACE_CATEGORIES.BARS.BREWERY,
      PLACE_CATEGORIES.BARS.SPORTS_BAR,
    ].join(',');
    
    return this.searchByCategory(ll, barIds, radius, 50);
  }

  /**
   * Get ALL shopping places in an area
   */
  getAllShopping(ll: string, radius: number = 5000): Observable<FoursquarePlace[]> {
    const shoppingIds = [
      PLACE_CATEGORIES.SHOPPING.ALL,
      PLACE_CATEGORIES.SHOPPING.DEPARTMENT_STORE,
      PLACE_CATEGORIES.SHOPPING.CLOTHING_STORE,
      PLACE_CATEGORIES.SHOPPING.MARKET,
      PLACE_CATEGORIES.SHOPPING.SUPERMARKET,
    ].join(',');
    
    return this.searchByCategory(ll, shoppingIds, radius, 50);
  }

  /**
   * Get ALL attractions in an area
   */
  getAllAttractions(ll: string, radius: number = 5000): Observable<FoursquarePlace[]> {
    const attractionIds = [
      PLACE_CATEGORIES.ATTRACTIONS.ALL,
      PLACE_CATEGORIES.ATTRACTIONS.HISTORICAL,
      PLACE_CATEGORIES.ATTRACTIONS.MONUMENTS,
      PLACE_CATEGORIES.ATTRACTIONS.TEMPLES,
      PLACE_CATEGORIES.ATTRACTIONS.CHURCHES,
      PLACE_CATEGORIES.ATTRACTIONS.MOSQUES,
    ].join(',');
    
    return this.searchByCategory(ll, attractionIds, radius, 50);
  }

  /**
   * Get ALL museums in an area
   */
  getAllMuseums(ll: string, radius: number = 5000): Observable<FoursquarePlace[]> {
    const museumIds = [
      PLACE_CATEGORIES.MUSEUMS.ALL,
      PLACE_CATEGORIES.MUSEUMS.ART_MUSEUM,
      PLACE_CATEGORIES.MUSEUMS.HISTORY_MUSEUM,
      PLACE_CATEGORIES.MUSEUMS.SCIENCE_MUSEUM,
    ].join(',');
    
    return this.searchByCategory(ll, museumIds, radius, 50);
  }

  /**
   * Get ALL parks in an area
   */
  getAllParks(ll: string, radius: number = 5000): Observable<FoursquarePlace[]> {
    const parkIds = [
      PLACE_CATEGORIES.PARKS.ALL,
      PLACE_CATEGORIES.PARKS.NATIONAL_PARK,
      PLACE_CATEGORIES.PARKS.GARDEN,
      PLACE_CATEGORIES.PARKS.BEACH,
      PLACE_CATEGORIES.PARKS.LAKE,
    ].join(',');
    
    return this.searchByCategory(ll, parkIds, radius, 50);
  }

  /**
   * Get ALL hotels in an area
   */
  getAllHotels(ll: string, radius: number = 5000): Observable<FoursquarePlace[]> {
    const hotelIds = [
      PLACE_CATEGORIES.HOTELS.ALL,
      PLACE_CATEGORIES.HOTELS.RESORT,
      PLACE_CATEGORIES.HOTELS.LUXURY_HOTEL,
      PLACE_CATEGORIES.HOTELS.BUDGET_HOTEL,
      PLACE_CATEGORIES.HOTELS.HOSTEL,
    ].join(',');
    
    return this.searchByCategory(ll, hotelIds, radius, 50);
  }

  /**
   * Get EVERYTHING nearby (all categories combined)
   */
  getAllNearbyPlaces(ll: string, radius: number = 5000): Observable<FoursquarePlace[]> {
    const allCategoryIds = [
      // Food & Drink
      PLACE_CATEGORIES.RESTAURANTS.ALL,
      PLACE_CATEGORIES.CAFES.ALL,
      PLACE_CATEGORIES.BARS.ALL,
      // Shopping
      PLACE_CATEGORIES.SHOPPING.ALL,
      // Attractions
      PLACE_CATEGORIES.ATTRACTIONS.ALL,
      // Museums
      PLACE_CATEGORIES.MUSEUMS.ALL,
      // Parks
      PLACE_CATEGORIES.PARKS.ALL,
      // Hotels
      PLACE_CATEGORIES.HOTELS.ALL,
    ].join(',');
    
    return this.searchByCategory(ll, allCategoryIds, radius, 50);
  }

  /**
   * Get place details by ID
   */
  getPlaceDetails(fsqPlaceId: string): Observable<FoursquarePlace> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'X-Places-Api-Version': '2025-06-17'
    });

    return this.http.get<FoursquarePlace>(`https://places-api.foursquare.com/places/${fsqPlaceId}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error fetching place details:', error);
          throw error;
        })
      );
  }

  /**
   * Get photos for a place
   */
  getPlacePhotos(fsqPlaceId: string, limit: number = 5): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    });

    return this.http.get(`https://places-api.foursquare.com/places/${fsqPlaceId}/photos`, {
      headers,
      params: { limit: limit.toString() }
    }).pipe(
      catchError(error => {
        console.error('Error fetching place photos:', error);
        return of([]);
      })
    );
  }

  /**
   * Get tips/reviews for a place
   */
  getPlaceTips(fsqPlaceId: string, limit: number = 5): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    });

    return this.http.get(`https://places-api.foursquare.com/places/${fsqPlaceId}/tips`, {
      headers,
      params: { limit: limit.toString() }
    }).pipe(
      catchError(error => {
        console.error('Error fetching place tips:', error);
        return of([]);
      })
    );
  }
}