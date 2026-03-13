import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UberPriceEstimate {
  product_id: string;
  display_name: string;
  estimate: string;
  currency_code: string;
  duration: number; // in seconds
  distance: number; // in miles
  high_estimate?: number;
  low_estimate?: number;
}

export interface UberTimeEstimate {
  product_id: string;
  display_name: string;
  estimate: number; // in seconds
}

@Injectable({
  providedIn: 'root'
})
export class UberService {
  private apiUrl = 'https://api.uber.com/v1.2';
  // Note: Uber API requires OAuth 2.0 with server-side authentication
  // This is a simplified version - in production, you need to get access token from your backend

  constructor(private http: HttpClient) {}

  getPriceEstimates(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): Observable<{ prices: UberPriceEstimate[] }> {
    // You need to get a valid access token from your backend
    const headers = new HttpHeaders({
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Accept-Language': 'en_US',
      'Content-Type': 'application/json'
    });

    return this.http.get<{ prices: UberPriceEstimate[] }>(`${this.apiUrl}/estimates/price`, {
      headers,
      params: {
        start_latitude: startLat.toString(),
        start_longitude: startLng.toString(),
        end_latitude: endLat.toString(),
        end_longitude: endLng.toString()
      }
    });
  }

  getTimeEstimates(
    startLat: number,
    startLng: number
  ): Observable<{ times: UberTimeEstimate[] }> {
    const headers = new HttpHeaders({
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Accept-Language': 'en_US',
      'Content-Type': 'application/json'
    });

    return this.http.get<{ times: UberTimeEstimate[] }>(`${this.apiUrl}/estimates/time`, {
      headers,
      params: {
        start_latitude: startLat.toString(),
        start_longitude: startLng.toString()
      }
    });
  }

  getProducts(
    lat: number,
    lng: number
  ): Observable<{ products: any[] }> {
    const headers = new HttpHeaders({
      'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      'Accept-Language': 'en_US',
      'Content-Type': 'application/json'
    });

    return this.http.get<{ products: any[] }>(`${this.apiUrl}/products`, {
      headers,
      params: {
        latitude: lat.toString(),
        longitude: lng.toString()
      }
    });
  }
}