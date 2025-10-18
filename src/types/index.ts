export interface Habit {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
  completed: boolean;
  userId: string;
  createdAt: Date;
  startDate?: string;
  endDate?: string;
  repeatDay?: string;
}

export interface HabitsLog {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  count: number;
  done: boolean;
  notes?: string;
  createdAt: Date;
}

export interface User {
  uid: string;
  email: string;
  username: string;
}
