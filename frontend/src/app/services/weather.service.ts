import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface ForecastData {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
    };
    visibility: number;
    pop: number;
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = 'https://api.openweathermap.org/data/2.5';
  private apiKey = environment.openWeatherApiKey;

  constructor(private http: HttpClient) {}

  getCurrentWeather(city: string): Observable<WeatherData> {
    return this.http.get<WeatherData>(`${this.apiUrl}/weather`, {
      params: {
        q: city,
        appid: this.apiKey,
        units: 'metric'
      }
    });
  }

  getCurrentWeatherByCoords(lat: number, lon: number): Observable<WeatherData> {
    return this.http.get<WeatherData>(`${this.apiUrl}/weather`, {
      params: {
        lat: lat.toString(),
        lon: lon.toString(),
        appid: this.apiKey,
        units: 'metric'
      }
    });
  }

  getForecast(city: string, days: number = 5): Observable<ForecastData> {
    return this.http.get<ForecastData>(`${this.apiUrl}/forecast`, {
      params: {
        q: city,
        appid: this.apiKey,
        units: 'metric',
        cnt: (days * 8).toString() // 8 forecasts per day
      }
    });
  }

  getForecastByCoords(lat: number, lon: number, days: number = 5): Observable<ForecastData> {
    return this.http.get<ForecastData>(`${this.apiUrl}/forecast`, {
      params: {
        lat: lat.toString(),
        lon: lon.toString(),
        appid: this.apiKey,
        units: 'metric',
        cnt: (days * 8).toString()
      }
    });
  }

  getIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
}