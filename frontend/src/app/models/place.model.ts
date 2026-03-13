export interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  priceLevel?: number;
  photoUrl?: string;
  distance?: number;
  travelTime?: number;
  phone?: string;
  website?: string;
  hours?: string;
  description?: string;
  isOpen?: boolean;
  priceRange?: string;
  reviews?: number;
}

export interface Weather {
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  pressure?: number;
  visibility?: number;
  sunrise?: number;
  sunset?: number;
  timezone?: number;
}

export interface TravelOption {
  type: 'uber' | 'ola' | 'auto' | 'bus' | 'metro' | 'taxi' | 'walk' | 'bike';
  provider: string;
  price: number;
  duration: number;
  distance: number;
  vehicleType?: string;
  currency?: string;
  description?: string;
  estimatedArrival?: Date;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface City {
  id: string;
  name: string;
  country: string;
  coordinates: Coordinates;
  description?: string;
  imageUrl?: string;
  population?: number;
  timezone?: string;
  currency?: string;
  language?: string;
  bestTimeToVisit?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  count?: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
  photos?: string[];
}

export interface OpeningHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  holiday?: string;
}

export interface ContactInfo {
  phone?: string;
  website?: string;
  email?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

// Helper function to convert price level to string
export function getPriceLevelString(level?: number): string {
  if (!level) return 'Not specified';
  const symbols = '₹'.repeat(level);
  return symbols;
}

// Helper function to format distance
export function formatDistance(meters?: number): string {
  if (!meters) return '';
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Helper function to format duration
export function formatDuration(minutes?: number): string {
  if (!minutes) return '';
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hr ${mins} min`;
}

// Helper function to get category icon
export function getCategoryIcon(category: string): string {
  const categoryMap: Record<string, string> = {
    'restaurant': '🍽️',
    'restaurants': '🍽️',
    'cafe': '☕',
    'cafes': '☕',
    'bar': '🍺',
    'bars': '🍺',
    'shopping': '🛍️',
    'mall': '🏬',
    'attraction': '🏛️',
    'attractions': '🏛️',
    'museum': '🏛️',
    'museums': '🏛️',
    'park': '🌳',
    'parks': '🌳',
    'hotel': '🏨',
    'hotels': '🏨',
    'beach': '🏖️',
    'temple': '🛕',
    'fort': '🏰',
    'palace': '👑',
    'market': '🏪',
    'theater': '🎭',
    'cinema': '🎬',
    'spa': '💆',
    'gym': '💪',
    'hospital': '🏥',
    'pharmacy': '💊',
    'bank': '🏦',
    'atm': '🏧',
    'gas station': '⛽',
    'parking': '🅿️',
    'airport': '✈️',
    'train station': '🚂',
    'bus station': '🚌',
    'metro station': '🚇'
  };
  
  const key = category.toLowerCase();
  return categoryMap[key] || '📍';
}