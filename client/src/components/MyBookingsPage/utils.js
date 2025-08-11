// Utility functions for booking management

//format date to readable string
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Calculate days until check-in
export const getDaysUntilCheckIn = (checkInDate) => {
  const today = new Date();
  const checkIn = new Date(checkInDate);
  const diffTime = checkIn - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Calculate booking statistics
export const calculateBookingStats = (bookings) => {
  return {
    booked: bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length
  };
};

// Filter bookings based on search term and status
export const filterBookings = (bookings, searchTerm, statusFilter) => {
  return bookings.filter(booking => {
    const matchesSearch = 
      booking.hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
};