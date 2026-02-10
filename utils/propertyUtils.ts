
import { Property, PropertyStatus, RentalType } from '../types';

/**
 * Calculates the real-time status of a property based on today's date
 * and its current bookings or contract dates.
 */
export const calculateCurrentStatus = (property: Property): PropertyStatus => {
  if (property.status === PropertyStatus.CANCELED) return PropertyStatus.CANCELED;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const today = new Date(todayStr);

  if (property.rentalType === RentalType.DAILY) {
    const bookings = property.bookings || [];
    
    // Check if currently occupied (Check-in time is usually noon, but we simplify to date-based)
    const activeBooking = bookings.find(b => {
      if (b.status === 'CANCELLED' || b.status === 'CHECKED_OUT') return false;
      const start = new Date(b.checkInDate);
      const end = new Date(b.checkOutDate);
      return today >= start && today < end;
    });

    if (activeBooking) {
      return activeBooking.status === 'CHECKED_IN' ? PropertyStatus.OCCUPIED : PropertyStatus.BOOKED;
    }

    // Check for future bookings to mark as BOOKED if close
    const futureBooking = bookings.find(b => {
      if (b.status !== 'CONFIRMED') return false;
      const start = new Date(b.checkInDate);
      return start > today;
    });

    return futureBooking ? PropertyStatus.BOOKED : PropertyStatus.VACANT;

  } else {
    // Monthly Rental
    if (!property.contractStartDate || !property.contractEndDate || !property.tenantName) {
      return PropertyStatus.VACANT;
    }

    const start = new Date(property.contractStartDate);
    const end = new Date(property.contractEndDate);

    if (today >= start && today <= end) {
      return PropertyStatus.OCCUPIED;
    }

    // If contract exists but hasn't started yet
    if (today < start) {
      return PropertyStatus.BOOKED;
    }

    // If contract has expired
    return PropertyStatus.VACANT;
  }
};
