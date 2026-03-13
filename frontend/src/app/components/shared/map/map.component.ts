import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafletMapService } from '../../../services/leaflet-map.service';
import { Place } from '../../../models/place.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #mapContainer class="h-[400px] w-full rounded-lg"></div>
  `
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() places: Place[] = [];
  @Input() center: [number, number] = [19.0760, 72.8777];
  
  private mapId: string;
  private isMapInitialized = false;

  constructor(private mapService: LeafletMapService) {
    // Generate a unique ID for this map instance
    this.mapId = 'map-' + Math.random().toString(36).substr(2, 9);
  }

  ngOnInit() {
    // Set the ID on the container element
    if (this.mapContainer) {
      this.mapContainer.nativeElement.id = this.mapId;
    }
  }

  ngAfterViewInit() {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  private initializeMap() {
    try {
      // Initialize the map
      this.mapService.initializeMap(this.mapId, this.center);
      this.isMapInitialized = true;
      
      // Add markers if there are places
      if (this.places && this.places.length > 0) {
        setTimeout(() => {
          this.mapService.addMarkers(this.places);
        }, 200);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  ngOnDestroy() {
    if (this.isMapInitialized) {
      this.mapService.destroy();
    }
  }
}