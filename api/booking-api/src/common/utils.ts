import { BookingStatus } from './entities';

export function randomCode(len = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function withBookedSeats<T extends { bookings: { seats: number }[] }>(dep: T) {
  const { bookings, ...rest } = dep;
  return { ...rest, bookedSeats: bookings.reduce((s, b) => s + b.seats, 0) };
}

export const activeStatuses = [BookingStatus.CANCELLED, BookingStatus.REFUNDED] as BookingStatus[];

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  createdAt: string;
}

export function toCustomerProfile(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  createdAt: Date;
}): CustomerProfile {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    street: user.street,
    city: user.city,
    zip: user.zip,
    createdAt: user.createdAt.toISOString(),
  };
}
