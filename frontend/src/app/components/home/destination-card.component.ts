import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-destination-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-effect rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <div class="relative h-48">
        <img [src]="imageUrl" [alt]="city.name" class="w-full h-full object-cover" loading="lazy">
        <div class="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg text-sm">
          ⭐ {{ city.rating }}
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-xl font-semibold mb-2">{{ city.name }}</h3>
        <p class="text-gray-400">{{ city.places }} places to visit</p>
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
export class DestinationCardComponent {
  @Input() city: any;
  @Input() imageUrl: string = '';
}