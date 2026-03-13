import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Weather } from '../../models/place.model';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-effect p-4 rounded-2xl">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-gray-400 mb-1">Current Weather</div>
          <div class="text-3xl font-bold">{{ weather.temp }}°C</div>
          <div class="text-sm text-gray-400">Feels like {{ weather.feelsLike }}°C</div>
        </div>
        <div class="text-center">
          <img [src]="'https://openweathermap.org/img/wn/' + weather.icon + '@2x.png'" 
               [alt]="weather.description" 
               class="w-16 h-16">
          <div class="text-sm capitalize">{{ weather.description }}</div>
        </div>
        <div class="text-right">
          <div class="text-sm text-gray-400">Humidity</div>
          <div class="font-semibold">{{ weather.humidity }}%</div>
          <div class="text-sm text-gray-400 mt-1">Wind</div>
          <div class="font-semibold">{{ weather.windSpeed }} km/h</div>
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
export class WeatherWidgetComponent {
  @Input() weather!: Weather;
}