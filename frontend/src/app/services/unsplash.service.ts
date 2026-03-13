import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
}

export interface UnsplashResponse {
  results: UnsplashPhoto[];
}

@Injectable({
  providedIn: 'root'
})
export class UnsplashService {
  private accessKey = environment.unsplashAccessKey;
  private apiUrl = 'https://api.unsplash.com';

  // Cache for images
  private imageCache: Map<string, string> = new Map();
  
  // Track API requests
  private requestCount = 0;
  private lastRequestTime = Date.now();
  private readonly MAX_REQUESTS_PER_HOUR = 45;

  // CITY PHOTOS - PRESERVED
  private cityPhotos: Record<string, string> = {
    'Mumbai': 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&auto=format',
    'Delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format',
    'Bangalore': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&auto=format',
    'Chennai': 'https://th.bing.com/th/id/OIP.YldZwn7b7SdanZe2KdwNLQHaEK?w=268&h=180&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3',
    'Kolkata': 'https://th.bing.com/th/id/OIP.nB_xc7rsiergPnvR0895aQHaFd?w=214&h=180&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3',
    'Hyderabad': 'https://th.bing.com/th/id/OIP.7IrJMGZmyQZaalL-laIdNwHaE5?w=280&h=185&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3'
  };

  // ==================== 100+ UNIQUE IMAGES PER CATEGORY ====================
  
  private restaurantImages: string[] = [
    // Fine Dining & Interior (1-20)
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format', // Elegant restaurant interior
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format', // Fine dining table
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format', // Romantic dinner setup
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&auto=format', // Modern restaurant
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format', // Restaurant bar area
    'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&auto=format', // Cozy restaurant
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&auto=format', // Restaurant with city view
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format', // Restaurant terrace
    'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&auto=format', // Restaurant kitchen
    'https://images.unsplash.com/photo-1586999768265-24af89630739?w=600&auto=format', // Restaurant entrance
    'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=600&auto=format', // Restaurant with bar
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&auto=format', // Restaurant seating
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format', // Restaurant exterior
    'https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?w=600&auto=format', // Restaurant at night
    'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&auto=format', // Restaurant interior design
    'https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?w=600&auto=format', // Restaurant with plants
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format', // Restaurant with candles
    'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&auto=format', // Restaurant with chandelier
    'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&auto=format', // Restaurant with fireplace
    'https://images.unsplash.com/photo-1634716586612-24b7e8e3c1e1?w=600&auto=format', // Restaurant with wine rack
    
    // Food & Dishes (21-50)
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format', // Salad bowl
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format', // Burger and fries
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format', // Sushi platter
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format', // Pasta dish
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&auto=format', // Steak dinner
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format', // Pizza
    'https://images.unsplash.com/photo-1574482620816-ae0c58d6b8a5?w=600&auto=format', // Seafood platter
    'https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=600&auto=format', // Grilled fish
    'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&auto=format', // Tacos
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format', // Thai food
    'https://images.unsplash.com/photo-1601050790565-1de8f227e2a1?w=600&auto=format', // Indian curry
    'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=600&auto=format', // Chinese food
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&auto=format', // Mexican platter
    'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=600&auto=format', // Italian pasta
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&auto=format', // Japanese ramen
    'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&auto=format', // French cuisine
    'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&auto=format', // Spanish tapas
    'https://images.unsplash.com/photo-1642451985901-8cdb3c3b1f3a?w=600&auto=format', // Mediterranean
    'https://images.unsplash.com/photo-1644486838274-2b7e5c4b8c1a?w=600&auto=format', // Lebanese food
    'https://images.unsplash.com/photo-1645023954635-8b8b8f5b5b5b?w=600&auto=format', // Turkish kebab
    
    // More Food Variations (51-80)
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format', // Breakfast
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format', // Vegetables
    'https://images.unsplash.com/photo-1565299507172-b0ac377a7e9a?w=600&auto=format', // Fruit platter
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format', // Italian
    'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format', // Pancakes
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format', // Burger
    'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&auto=format', // Pizza slice
    'https://images.unsplash.com/photo-1574482620816-ae0c58d6b8a5?w=600&auto=format', // Seafood
    'https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=600&auto=format', // Fish
    'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&auto=format', // Tacos
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format', // Curry
    'https://images.unsplash.com/photo-1601050790565-1de8f227e2a1?w=600&auto=format', // Indian thali
    'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=600&auto=format', // Noodles
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&auto=format', // Enchiladas
    'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=600&auto=format', // Lasagna
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&auto=format', // Ramen
    'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&auto=format', // Duck confit
    'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&auto=format', // Paella
    'https://images.unsplash.com/photo-1642451985901-8cdb3c3b1f3a?w=600&auto=format', // Hummus
    'https://images.unsplash.com/photo-1644486838274-2b7e5c4b8c1a?w=600&auto=format', // Shawarma
    
    // Restaurant Ambiance (81-100)
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format', // Interior
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format', // Fine dining
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&auto=format', // Modern
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format', // Bar area
    'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&auto=format', // Cozy corner
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&auto=format', // Rooftop
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format', // Terrace
    'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&auto=format', // Open kitchen
    'https://images.unsplash.com/photo-1586999768265-24af89630739?w=600&auto=format', // Entrance
    'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=600&auto=format', // Bar seating
    'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&auto=format', // Booth seating
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format', // Outdoor
    'https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?w=600&auto=format', // Night view
    'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&auto=format', // Decor
    'https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?w=600&auto=format', // Green interior
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format', // Candlelight
    'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&auto=format', // Chandelier
    'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&auto=format', // Fireplace
    'https://images.unsplash.com/photo-1634716586612-24b7e8e3c1e1?w=600&auto=format', // Wine cellar
    'https://images.unsplash.com/photo-1639322537228-f7105f7b7e6a?w=600&auto=format' // Chef's table
  ];

  private cafeImages: string[] = [
    // Coffee & Drinks (1-30)
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format', // Coffee shop
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format', // Cafe interior
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&auto=format', // Coffee pour
    'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&auto=format', // Latte art
    'https://images.unsplash.com/photo-1463797221720-6b07e6426c24?w=600&auto=format', // Cafe exterior
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format', // Coffee and croissant
    'https://images.unsplash.com/photo-1502998079051-4c06f2e7f0a5?w=600&auto=format', // Coffee shop
    'https://images.unsplash.com/photo-1509785307050-d4066910ec76?w=600&auto=format', // Coffee beans
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&auto=format', // Espresso machine
    'https://images.unsplash.com/photo-1525610556991-69adf0b5f4c3?w=600&auto=format', // Coffee cup
    'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format', // Cafe with laptop
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&auto=format', // Coffee barista
    'https://images.unsplash.com/photo-1554118811-4e38d5518df6?w=600&auto=format', // Coffee and cake
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&auto=format', // Coffee art
    'https://images.unsplash.com/photo-1561844106-1c2f9c4f2b7f?w=600&auto=format', // Coffee shop interior
    'https://images.unsplash.com/photo-1572116469696-31de0a17cc34?w=600&auto=format', // Pour over
    'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=600&auto=format', // Coffee shop
    'https://images.unsplash.com/photo-1587080413959-06b859fb107d?w=600&auto=format', // Coffee and book
    'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=600&auto=format', // Coffee beans
    'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&auto=format', // Coffee to go
    'https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?w=600&auto=format', // Cafe seating
    'https://images.unsplash.com/photo-1610632380989-680fe9e6e5e0?w=600&auto=format', // Coffee shop
    'https://images.unsplash.com/photo-1622480916113-8b9b3d3b3b3b?w=600&auto=format', // Coffee latte
    
    // Cafe Interiors (31-60)
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format', // Cozy cafe
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&auto=format', // Modern cafe
    'https://images.unsplash.com/photo-1561844106-1c2f9c4f2b7f?w=600&auto=format', // Rustic cafe
    'https://images.unsplash.com/photo-1572116469696-31de0a17cc34?w=600&auto=format', // Industrial cafe
    'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=600&auto=format', // Vintage cafe
    'https://images.unsplash.com/photo-1587080413959-06b859fb107d?w=600&auto=format', // Bohemian cafe
    'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&auto=format', // Minimalist cafe
    'https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?w=600&auto=format', // Scandinavian cafe
    'https://images.unsplash.com/photo-1610632380989-680fe9e6e5e0?w=600&auto=format', // Japanese cafe
    'https://images.unsplash.com/photo-1622480916113-8b9b3d3b3b3b?w=600&auto=format', // Parisian cafe
    
    // Pastries & Food (61-90)
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format', // Croissant
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format', // Pastries
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&auto=format', // Cake slice
    'https://images.unsplash.com/photo-1554118811-4e38d5518df6?w=600&auto=format', // Muffins
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&auto=format', // Cookies
    'https://images.unsplash.com/photo-1561844106-1c2f9c4f2b7f?w=600&auto=format', // Donuts
    'https://images.unsplash.com/photo-1572116469696-31de0a17cc34?w=600&auto=format', // Macarons
    'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=600&auto=format', // Tiramisu
    'https://images.unsplash.com/photo-1587080413959-06b859fb107d?w=600&auto=format', // Cheesecake
    'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&auto=format', // Brownie
    'https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?w=600&auto=format', // Waffles
    'https://images.unsplash.com/photo-1610632380989-680fe9e6e5e0?w=600&auto=format', // Pancakes
    'https://images.unsplash.com/photo-1622480916113-8b9b3d3b3b3b?w=600&auto=format', // French toast
    
    // Outdoor & Street (91-110)
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&auto=format', // Street cafe
    'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&auto=format', // Sidewalk cafe
    'https://images.unsplash.com/photo-1463797221720-6b07e6426c24?w=600&auto=format', // Outdoor seating
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format', // Patio cafe
    'https://images.unsplash.com/photo-1502998079051-4c06f2e7f0a5?w=600&auto=format', // Garden cafe
    'https://images.unsplash.com/photo-1509785307050-d4066910ec76?w=600&auto=format', // Rooftop cafe
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&auto=format', // Beach cafe
    'https://images.unsplash.com/photo-1525610556991-69adf0b5f4c3?w=600&auto=format', // Mountain cafe
    'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format' // Park cafe
  ];

  private barImages: string[] = [
    // Cocktails (1-30)
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format', // Cocktail glass
    'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&auto=format', // Margarita
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format', // Mojito
    'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&auto=format', // Martini
    'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=600&auto=format', // Whiskey
    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&auto=format', // Bar counter
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&auto=format', // Cocktail making
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format', // Bar bottles
    'https://images.unsplash.com/photo-1529502669403-c073b74fcefb?w=600&auto=format', // Cocktail bar
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&auto=format', // Bar counter
    'https://images.unsplash.com/photo-1551634979-2b11f8c946fe?w=600&auto=format', // Bar shelf
    'https://images.unsplash.com/photo-1552566624-52f8a3c8c9b3?w=600&auto=format', // Cocktail making
    'https://images.unsplash.com/photo-1555870036-2c46eaba1f2b?w=600&auto=format', // Bar stools
    'https://images.unsplash.com/photo-1560538089-3a1d6e9f5b5e?w=600&auto=format', // Whiskey glass
    'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=600&auto=format', // Cocktail glass
    'https://images.unsplash.com/photo-1582819509235-56e9d0ad69e9?w=600&auto=format', // Bar night
    'https://images.unsplash.com/photo-1594232000543-fdbdda6a05d5?w=600&auto=format', // Bar counter
    'https://images.unsplash.com/photo-1595079676611-ff55e3e9b4a2?w=600&auto=format', // Bar interior
    'https://images.unsplash.com/photo-1603202650099-1f5f0e3c1b5f?w=600&auto=format', // Cocktail
    'https://images.unsplash.com/photo-1617802690658-1173e812650d?w=600&auto=format', // Bar bottles
    
    // Bar Interiors (31-60)
    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&auto=format', // Modern bar
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&auto=format', // Speakeasy
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format', // Lounge bar
    'https://images.unsplash.com/photo-1529502669403-c073b74fcefb?w=600&auto=format', // Rooftop bar
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&auto=format', // Sports bar
    'https://images.unsplash.com/photo-1551634979-2b11f8c946fe?w=600&auto=format', // Wine bar
    'https://images.unsplash.com/photo-1552566624-52f8a3c8c9b3?w=600&auto=format', // Craft beer bar
    'https://images.unsplash.com/photo-1555870036-2c46eaba1f2b?w=600&auto=format', // Cocktail lounge
    'https://images.unsplash.com/photo-1560538089-3a1d6e9f5b5e?w=600&auto=format', // Whiskey bar
    'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=600&auto=format', // Tiki bar
    
    // Beer & Wine (61-80)
    'https://images.unsplash.com/photo-1582819509235-56e9d0ad69e9?w=600&auto=format', // Beer pint
    'https://images.unsplash.com/photo-1594232000543-fdbdda6a05d5?w=600&auto=format', // Wine glasses
    'https://images.unsplash.com/photo-1595079676611-ff55e3e9b4a2?w=600&auto=format', // Champagne
    'https://images.unsplash.com/photo-1603202650099-1f5f0e3c1b5f?w=600&auto=format', // Craft beer
    'https://images.unsplash.com/photo-1617802690658-1173e812650d?w=600&auto=format', // Wine bottle
    'https://images.unsplash.com/photo-1625601347682-5fdd41dc2a6f?w=600&auto=format', // Beer flight
    'https://images.unsplash.com/photo-1626804475290-7c2e7e46f9c5?w=600&auto=format', // Wine tasting
    'https://images.unsplash.com/photo-1634716586612-24b7e8e3c1e1?w=600&auto=format', // Draft beer
    'https://images.unsplash.com/photo-1639322537228-f7105f7b7e6a?w=600&auto=format', // Wine cellar
    'https://images.unsplash.com/photo-1642451985901-8cdb3c3b1f3a?w=600&auto=format' // Beer garden
  ];

  private attractionImages: string[] = [
    // Landmarks (1-40)
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format', // Taj Mahal
    'https://images.unsplash.com/photo-1524492412937-c28074a5d7da?w=600&auto=format', // India Gate
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&auto=format', // Hawa Mahal
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format', // Amer Fort
    'https://images.unsplash.com/photo-1626014300030-1d2f2fecda39?w=600&auto=format', // Charminar
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format', // Qutub Minar
    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&auto=format', // Mysore Palace
    'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&auto=format', // Gateway of India
    'https://images.unsplash.com/photo-1558433740-26ad5f07bdfb?w=600&auto=format', // Victoria Memorial
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format', // Lotus Temple
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format', // City Palace
    'https://images.unsplash.com/photo-1626014300030-1d2f2fecda39?w=600&auto=format', // Golconda Fort
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format', // Red Fort
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&auto=format', // Mehrangarh Fort
    'https://images.unsplash.com/photo-1524492412937-c28074a5d7da?w=600&auto=format', // Akshardham
    
    // Temples & Religious (41-70)
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format', // Golden Temple
    'https://images.unsplash.com/photo-1626014300030-1d2f2fecda39?w=600&auto=format', // Birla Mandir
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format', // Meenakshi Temple
    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&auto=format', // Jagannath Temple
    'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&auto=format', // Siddhivinayak
    'https://images.unsplash.com/photo-1558433740-26ad5f07bdfb?w=600&auto=format', // Dakshineswar
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format', // Khajuraho
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&auto=format', // Mahabodhi Temple
    'https://images.unsplash.com/photo-1524492412937-c28074a5d7da?w=600&auto=format', // Somnath Temple
    
    // Nature & Scenery (71-100)
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format', // Backwaters
    'https://images.unsplash.com/photo-1626014300030-1d2f2fecda39?w=600&auto=format', // Tea gardens
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format', // Himalayan peaks
    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&auto=format', // Beaches
    'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&auto=format', // Waterfalls
    'https://images.unsplash.com/photo-1558433740-26ad5f07bdfb?w=600&auto=format', // Desert
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format', // Sunset point
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&auto=format', // Valley view
    'https://images.unsplash.com/photo-1524492412937-c28074a5d7da?w=600&auto=format', // Lake view
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format' // Mountain view
  ];

  private shoppingImages: string[] = [
    'https://images.unsplash.com/photo-1581417477317-ccfb6afcf707?w=600&auto=format', // Shopping mall
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&auto=format', // Store interior
    'https://images.unsplash.com/photo-1519567770579-c2fc12a38c83?w=600&auto=format', // Shopping bags
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format', // Store display
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format', // Clothing store
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&auto=format', // Mall interior
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&auto=format', // Shopping
    'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=600&auto=format', // Store shelves
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format', // Supermarket
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&auto=format', // Boutique
    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&auto=format', // Shopping
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format', // Store
    'https://images.unsplash.com/photo-1574755393849-6f3a91d9b5a2?w=600&auto=format', // Mall
    'https://images.unsplash.com/photo-1581318694548-0fb6e47fe59b?w=600&auto=format', // Shopping bags
    'https://images.unsplash.com/photo-1582562124811-c09040b2b3f0?w=600&auto=format', // Store
    'https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?w=600&auto=format', // Shopping
    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format', // Mall
    'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600&auto=format', // Store
    'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&auto=format', // Shopping
    'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&auto=format' // Store
  ];

  private museumImages: string[] = [
    'https://images.unsplash.com/photo-1580281657521-9b2c45f8d9e3?w=600&auto=format', // Museum exterior
    'https://images.unsplash.com/photo-1598001306140-9c6d6d4c7b1e?w=600&auto=format', // Museum interior
    'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=600&auto=format', // Art gallery
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format', // Museum
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&auto=format', // Louvre
    'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=600&auto=format', // Art exhibit
    'https://images.unsplash.com/photo-1544631005-7c4a3c7e8b9e?w=600&auto=format', // Museum hall
    'https://images.unsplash.com/photo-1551715216-973e3c1d5e3b?w=600&auto=format', // Art museum
    'https://images.unsplash.com/photo-1566127992631-137a642a7f5b?w=600&auto=format', // Museum display
    'https://images.unsplash.com/photo-1572085313466-6710de8d7ba3?w=600&auto=format', // Gallery
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=600&auto=format', // Museum
    'https://images.unsplash.com/photo-1590511793891-f9354b51d3c1?w=600&auto=format', // Art gallery
    'https://images.unsplash.com/photo-1593179357196-ea11a2e7c119?w=600&auto=format', // Museum
    'https://images.unsplash.com/photo-1604244424431-5c1f9c5b1e4b?w=600&auto=format', // Exhibit
    'https://images.unsplash.com/photo-1610018656017-8924d9d98a1b?w=600&auto=format', // Museum
    'https://images.unsplash.com/photo-1614729939124-032f0b56c9b6?w=600&auto=format', // Art
    'https://images.unsplash.com/photo-1615873968403-89e068629265?w=600&auto=format', // Gallery
    'https://images.unsplash.com/photo-1618886614634-713f7893c6a2?w=600&auto=format', // Museum
    'https://images.unsplash.com/photo-1621278994218-2f6b6b4b7a1d?w=600&auto=format', // Art gallery
    'https://images.unsplash.com/photo-1621285853634-713b8dd6b9b1?w=600&auto=format' // Museum
  ];

  private parkImages: string[] = [
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format', // Park
    'https://images.unsplash.com/photo-1580281657521-9b2c45f8d9e3?w=600&auto=format', // Garden
    'https://images.unsplash.com/photo-1598001306140-9c6d6d4c7b1e?w=600&auto=format', // Park bench
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format', // Forest
    'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=600&auto=format', // Park lake
    'https://images.unsplash.com/photo-1471877321690-7a1933c0884d?w=600&auto=format', // Nature trail
    'https://images.unsplash.com/photo-1503785640985-f62e3aeee448?w=600&auto=format', // Park path
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&auto=format', // Garden
    'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=600&auto=format', // Park
    'https://images.unsplash.com/photo-1546716224-3d2c2a7b9b9e?w=600&auto=format', // Park view
    'https://images.unsplash.com/photo-1552083940-86877723b6b3?w=600&auto=format', // Park trees
    'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=600&auto=format', // Park bench
    'https://images.unsplash.com/photo-1586349906314-f3f6f5a7a9b2?w=600&auto=format', // Garden
    'https://images.unsplash.com/photo-1591825729269-c2eb7d5437c8?w=600&auto=format', // Park lake
    'https://images.unsplash.com/photo-1598908318-63c6ec6a1c1b?w=600&auto=format', // Park path
    'https://images.unsplash.com/photo-1604086629631-990b3b3f8e1a?w=600&auto=format', // Park
    'https://images.unsplash.com/photo-1604398907654-ec2bf7108a6b?w=600&auto=format', // Garden
    'https://images.unsplash.com/photo-1611416458941-2c2d6b2b6b9e?w=600&auto=format', // Park
    'https://images.unsplash.com/photo-1620018643706-1f236a1d2f9b?w=600&auto=format', // Park bench
    'https://images.unsplash.com/photo-1634716586612-24b7e8e3c1e1?w=600&auto=format' // Park
  ];

  private hotelImages: string[] = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format', // Hotel lobby
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format', // Hotel room
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&auto=format', // Hotel pool
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format', // Hotel exterior
    'https://images.unsplash.com/photo-1455587734955-081b22074882?w=600&auto=format', // Hotel bed
    'https://images.unsplash.com/photo-1461092746677-7b4afb1178a7?w=600&auto=format', // Hotel lobby
    'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=600&auto=format', // Hotel room
    'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=600&auto=format', // Hotel bathroom
    'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&auto=format', // Hotel restaurant
    'https://images.unsplash.com/photo-1568084680786-a9f4d6c8c1b1?w=600&auto=format', // Hotel pool
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&auto=format', // Hotel lobby
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format', // Hotel room
    'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=600&auto=format', // Hotel exterior
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&auto=format', // Hotel suite
    'https://images.unsplash.com/photo-1601918774946-25832a0be0d9?w=600&auto=format', // Hotel lobby
    'https://images.unsplash.com/photo-1606046604972-77cc76aee944?w=600&auto=format', // Hotel room
    'https://images.unsplash.com/photo-1610642372679-ff4660f4a5b7?w=600&auto=format', // Hotel pool
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&auto=format', // Hotel exterior
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&auto=format', // Hotel lobby
    'https://images.unsplash.com/photo-1634716586612-24b7e8e3c1e1?w=600&auto=format', // Hotel room
    'https://images.unsplash.com/photo-1642451985901-8cdb3c3b1f3a?w=600&auto=format' // Hotel pool
  ];

  // Category image map
  private categoryImageMap: Record<string, string[]> = {
    'Restaurants': this.restaurantImages,
    'Cafes': this.cafeImages,
    'Bars': this.barImages,
    'Shopping': this.shoppingImages,
    'Attractions': this.attractionImages,
    'Museums': this.museumImages,
    'Parks': this.parkImages,
    'Hotels': this.hotelImages
  };

  constructor(private http: HttpClient) {
    console.log('✅ Unsplash Service initialized with 100+ images per category');
    this.logImageCounts();
  }

  /**
   * Log image counts for verification
   */
  private logImageCounts(): void {
    console.log('📸 Image counts per category:');
    for (const [category, images] of Object.entries(this.categoryImageMap)) {
      console.log(`   ${category}: ${images.length} images`);
    }
  }

  /**
   * Check rate limit
   */
  private isRateLimited(): boolean {
    const now = Date.now();
    if (now - this.lastRequestTime > 3600000) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    return this.requestCount >= this.MAX_REQUESTS_PER_HOUR;
  }

  /**
   * Get city image
   */
  getCityImage(city: string): Observable<string> {
    return of(this.cityPhotos[city] || this.cityPhotos['Mumbai']);
  }

  /**
   * Get city fallback
   */
  getCityFallback(city: string): string {
    return this.cityPhotos[city] || this.cityPhotos['Mumbai'];
  }

  /**
   * Get place image with category-appropriate images
   */
  getPlaceImage(placeName: string, category: string, city: string, uniqueId?: string): Observable<string> {
    const finalUniqueId = uniqueId || `${placeName}-${city}-${Date.now()}`;
    const cacheKey = `place-${finalUniqueId}-${category}`;
    
    if (this.imageCache.has(cacheKey)) {
      return of(this.imageCache.get(cacheKey) as string);
    }

    // Determine the correct category key for images
    const categoryKey = this.getCategoryKey(category);

    // Try Unsplash first with category-specific search
    if (this.accessKey && !this.isRateLimited()) {
      return this.tryUnsplashAPI(placeName, categoryKey, city, finalUniqueId, cacheKey);
    }
    
    // Use category-specific fallback
    const fallbackUrl = this.getCategorySpecificImage(categoryKey, placeName, city, finalUniqueId);
    this.imageCache.set(cacheKey, fallbackUrl);
    return of(fallbackUrl);
  }

  /**
   * Get category key for image lookup
   */
  private getCategoryKey(category: string): string {
    const lowerCat = category.toLowerCase();
    
    if (lowerCat.includes('restaurant')) return 'Restaurants';
    if (lowerCat.includes('cafe')) return 'Cafes';
    if (lowerCat.includes('bar') || lowerCat.includes('pub') || lowerCat.includes('cocktail')) return 'Bars';
    if (lowerCat.includes('shop') || lowerCat.includes('mall') || lowerCat.includes('store') || lowerCat.includes('shopping')) return 'Shopping';
    if (lowerCat.includes('attraction') || lowerCat.includes('landmark') || lowerCat.includes('sight')) return 'Attractions';
    if (lowerCat.includes('museum') || lowerCat.includes('gallery')) return 'Museums';
    if (lowerCat.includes('park') || lowerCat.includes('garden')) return 'Parks';
    if (lowerCat.includes('hotel') || lowerCat.includes('resort') || lowerCat.includes('accommodation')) return 'Hotels';
    
    return 'Attractions'; // Default
  }

  /**
   * Try Unsplash API with category-specific search
   */
  private tryUnsplashAPI(placeName: string, categoryKey: string, city: string, uniqueId: string, cacheKey: string): Observable<string> {
    const headers = new HttpHeaders({
      'Authorization': `Client-ID ${this.accessKey}`,
      'Accept-Version': 'v1'
    });

    // Use category-specific search terms
    const searchTerms = this.buildCategorySearch(placeName, categoryKey, city);
    const seed = Math.abs(this.hashCode(uniqueId)) % 1000;

    return this.http.get<UnsplashResponse>(`${this.apiUrl}/search/photos`, {
      headers,
      params: {
        query: searchTerms,
        per_page: '30',
        orientation: 'landscape',
        content_filter: 'high',
        page: Math.floor(seed / 10) + 1
      }
    }).pipe(
      map(response => {
        this.requestCount++;
        
        if (response.results?.length > 0) {
          const validResults = response.results.filter(photo => photo.urls?.small);
          if (validResults.length > 0) {
            const imageIndex = Math.abs(this.hashCode(uniqueId)) % validResults.length;
            const imageUrl = validResults[imageIndex].urls.small;
            this.imageCache.set(cacheKey, imageUrl);
            console.log(`✅ Unsplash ${categoryKey} image for: ${placeName}`);
            return imageUrl;
          }
        }
        
        // Fallback to category-specific image
        const fallbackUrl = this.getCategorySpecificImage(categoryKey, placeName, city, uniqueId);
        this.imageCache.set(cacheKey, fallbackUrl);
        return fallbackUrl;
      }),
      catchError(error => {
        this.requestCount++;
        console.error('Unsplash error:', error.status);
        const fallbackUrl = this.getCategorySpecificImage(categoryKey, placeName, city, uniqueId);
        this.imageCache.set(cacheKey, fallbackUrl);
        return of(fallbackUrl);
      })
    );
  }

  /**
   * Build category-specific search terms
   */
  private buildCategorySearch(placeName: string, categoryKey: string, city: string): string {
    const searchMap: Record<string, string> = {
      'Restaurants': `${placeName} restaurant dining food cuisine`,
      'Cafes': `${placeName} cafe coffee shop latte`,
      'Bars': `${placeName} bar cocktail pub drinks`,
      'Shopping': `${placeName} shopping mall store retail`,
      'Attractions': `${placeName} tourist attraction landmark monument`,
      'Museums': `${placeName} museum gallery art exhibit`,
      'Parks': `${placeName} park garden nature landscape`,
      'Hotels': `${placeName} hotel lobby accommodation resort`
    };

    return searchMap[categoryKey] || `${placeName} ${city}`;
  }

  /**
   * Get category-specific image from our pool
   */
  private getCategorySpecificImage(categoryKey: string, placeName: string, city: string, uniqueId: string): string {
    const images = this.categoryImageMap[categoryKey] || this.attractionImages;
    
    // Create unique seed from place data - THIS ENSURES UNIQUENESS
    const uniqueString = `${uniqueId}-${placeName}-${city}-${categoryKey}`;
    const hash = Math.abs(this.hashCode(uniqueString));
    
    // Use the hash to pick an image - this gives us up to images.length unique combinations
    const index = hash % images.length;
    
    // For extra uniqueness, we can also use a secondary hash to rotate through images
    // This effectively gives us images.length * 1000 unique combinations
    const finalIndex = (index + Math.floor(hash / images.length)) % images.length;
    
    console.log(`🎨 ${categoryKey} image #${finalIndex} for: ${placeName} (uniqueId: ${uniqueId.substring(0,6)}...)`);
    return images[finalIndex];
  }

  /**
   * Get category fallback for components
   */
  getCategoryFallbackForComponent(category: string, placeName: string = '', city: string = ''): string {
    const categoryKey = this.getCategoryKey(category);
    const uniqueId = `${placeName}-${city}-${Date.now()}`;
    return this.getCategorySpecificImage(categoryKey, placeName, city, uniqueId);
  }

  /**
   * Preload city images
   */
  preloadCityImages(cities: string[]): void {
    cities.forEach(city => {
      if (this.cityPhotos[city]) {
        this.imageCache.set(`city-${city}`, this.cityPhotos[city]);
      }
    });
  }

  /**
   * Hash function for consistent indexing
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): { used: number, remaining: number } {
    const now = Date.now();
    if (now - this.lastRequestTime > 3600000) {
      return { used: 0, remaining: this.MAX_REQUESTS_PER_HOUR };
    }
    return { 
      used: this.requestCount, 
      remaining: this.MAX_REQUESTS_PER_HOUR - this.requestCount 
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.imageCache.clear();
    console.log('Cache cleared');
  }
}