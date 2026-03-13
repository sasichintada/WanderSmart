export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role: string;
  loginCount: number;
  lastLoginAt?: Date;  // This exists in your backend
  // Remove createdAt if it doesn't exist in backend
  preferences?: UserPreferences;
}

export interface UserPreferences {
  budgetLevel: string;
  preferredTravelStyles: string[];
  preferredActivities: string[];
  favoriteDestinations: string[];
  currency: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: Date;
  user: User;
}

export interface UserActivity {
  id: string;
  activityType: string;
  description: string;
  timestamp: Date;
  metadata: Record<string, string>;
}

export interface LoginHistory {
  id: string;
  loginTime: Date;
  logoutTime?: Date;
  ipAddress: string;
  deviceInfo: string;
  location: string;
  isSuccessful: boolean;
}