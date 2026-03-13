import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'planner',
    loadComponent: () => import('./pages/planner/planner.component').then(m => m.PlannerComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'city/:name',
    loadComponent: () => import('./components/city/details/city-details.component').then(m => m.CityDetailsComponent),
    // REMOVE THIS LINE: canActivate: [AuthGuard]  <-- Remove this so city pages are public
  },
  {
    path: 'itinerary',
    loadComponent: () => import('./components/itinerary/list/itinerary-list.component').then(m => m.ItineraryListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'itinerary/create',
    loadComponent: () => import('./components/itinerary/create/itinerary-create.component').then(m => m.ItineraryCreateComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'itinerary/:id',
    loadComponent: () => import('./components/itinerary/detail/itinerary-detail.component').then(m => m.ItineraryDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'itinerary/edit/:id',
    loadComponent: () => import('./components/itinerary/edit/itinerary-edit.component').then(m => m.ItineraryEditComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];