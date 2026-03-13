import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { User, LoginResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/Auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        console.log('✅ User loaded from storage:', user);
      } catch (e) {
        console.error('Error loading user from storage:', e);
        this.logout();
      }
    }
  }

  register(registerData: { 
    username: string; 
    email: string; 
    password: string;
    firstName?: string;
    lastName?: string;
  }): Observable<any> {
    const payload = {
      email: registerData.email,
      username: registerData.username,
      password: registerData.password,
      firstName: registerData.firstName || '',
      lastName: registerData.lastName || ''
    };
    
    return this.http.post(`${this.apiUrl}/register`, payload).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  login(usernameOrEmail: string, password: string): Observable<LoginResponse> {
    const loginData = { 
      usernameOrEmail: usernameOrEmail,
      password: password
    };
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
          }
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
          console.log('✅ User logged in successfully:', response.user);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('❌ Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        next: () => {
          console.log('✅ Logout successful');
        },
        error: (err) => {
          console.error('❌ Logout error:', err);
        },
        complete: () => {
          this.clearLocalStorage();
        }
      });
    } else {
      this.clearLocalStorage();
    }
  }

  private clearLocalStorage(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get the current user ID from localStorage or currentUserSubject
   */
  getCurrentUserId(): string | null {
    // First try to get from currentUserSubject
    const currentUser = this.currentUserSubject.value;
    if (currentUser?.id) {
      return currentUser.id;
    }
    
    // Fallback to localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id || null;
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Get the current user data as a plain object
   */
  getCurrentUserData(): User | null {
    // Try from subject first
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      return currentUser;
    }
    
    // Fallback to localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Check if user is logged in and has valid session
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUserId();
  }

  getUserActivities(limit: number = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/activities?limit=${limit}`)
      .pipe(catchError(this.handleError));
  }

  getLoginHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/login-history`)
      .pipe(catchError(this.handleError));
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    
    if (error.status === 401) {
      this.clearLocalStorage();
    }
    
    return throwError(() => error);
  }
}