import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OlaPriceEstimate {
  category: string;
  distance: number;
  duration: number;
  fare: {
    minimum: number;
    maximum: number;
    currency: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OlaService {
  private apiUrl = 'https://api.ola.com/v1';

  constructor(private http: HttpClient) {}

  getFareEstimate(
    pickupLat: number,
    pickupLng: number,
    dropLat: number,
    dropLng: number,
    category?: string
  ): Observable<OlaPriceEstimate[]> {
    // You need to get a valid access token
    const headers = new HttpHeaders({
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json',
      'x-app-token': 'YOUR_APP_TOKEN'
    });

    let params: any = {
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      drop_lat: dropLat,
      drop_lng: dropLng
    };

    if (category) {
      params.category = category;
    }

    return this.http.get<OlaPriceEstimate[]>(`${this.apiUrl}/products/fares`, {
      headers,
      params
    });
  }

  getRideEstimate(
    pickupLat: number,
    pickupLng: number
  ): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json',
      'x-app-token': 'YOUR_APP_TOKEN'
    });

    return this.http.get(`${this.apiUrl}/products/estimate`, {
      headers,
      params: {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng
      }
    });
  }
}