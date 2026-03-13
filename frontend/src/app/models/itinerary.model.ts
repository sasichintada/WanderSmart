export interface Itinerary {
  id?: string;
  userId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
  budget?: number;
  preferences?: string[];
  dayPlans: DayPlan[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DayPlan {
  day: number;
  date: Date;
  activities: Activity[];
}

export interface Activity {
  time: string;
  title: string;
  description?: string;
  location?: string;
  cost?: number;
  type: 'attraction' | 'restaurant' | 'transport' | 'shopping' | 'other';
}