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
