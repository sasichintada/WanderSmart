import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Place } from '../models/place.model';

// Fix for marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

@Injectable({
  providedIn: 'root'
})
export class LeafletMapService {
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];

  constructor() {}

  initializeMap(elementId: string, center: [number, number], zoom: number = 13): L.Map {
    // Destroy existing map if any
    this.destroy();

    // Find the element
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Map element with id '${elementId}' not found`);
      throw new Error('Map container not found');
    }

    // Create new map
    this.map = L.map(elementId).setView(center, zoom);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Force map to resize after initialization
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);

    console.log('✅ Map initialized with ID:', elementId);
    return this.map;
  }

  addMarker(lat: number, lng: number, popupText?: string): L.Marker {
    if (!this.map) throw new Error('Map not initialized');
    
    const marker = L.marker([lat, lng]).addTo(this.map);
    this.markers.push(marker);
    
    if (popupText) {
      marker.bindPopup(popupText);
    }
    
    return marker;
  }

  addMarkers(places: Place[]): void {
    if (!this.map) {
      console.error('Map not initialized');
      return;
    }
    
    // Clear existing markers
    this.clearMarkers();
    
    // Add new markers
    places.forEach(place => {
      if (place.latitude && place.longitude) {
        const marker = L.marker([place.latitude, place.longitude]).addTo(this.map!);
        marker.bindPopup(`
          <b>${place.name}</b><br>
          ${place.address}<br>
          ⭐ ${place.rating || 'N/A'}
        `);
        this.markers.push(marker);
      }
    });

    // Fit bounds to show all markers
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];
  }

  fitBounds(bounds: L.LatLngBounds): void {
    if (!this.map) throw new Error('Map not initialized');
    this.map.fitBounds(bounds);
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markers = [];
    }
  }
}