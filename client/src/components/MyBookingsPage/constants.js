// Booking status configuration
export const BOOKING_STATUSES = {
  confirmed: { label: 'Confirmed', color: 'green', icon: 'CheckCircle2' },
  pending: { label: 'Pending', color: 'yellow', icon: 'AlertCircle' },
  cancelled: { label: 'Cancelled', color: 'red', icon: 'XCircle' },
  completed: { label: 'Completed', color: 'blue', icon: 'CheckCircle2' }
};

// Filter options for booking status
export const FILTER_OPTIONS = [
  { value: 'all', label: 'All Bookings' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' }
];

// Sample booking data for the user (API-ready structure)
export const USER_BOOKINGS = [
  {
    id: 'BK001',
    bookingNumber: 'SIN-2025-001',
    hotel: {
      id: 'HTL001',
      name: 'The Fullerton Hotel Singapore',
      address: '1 Fullerton Square, Singapore',
      stars: 5,
      image: '/src/assets/hotels/fullerton.jpg' 
    },
    room: {
      id: 'RM001',
      type: 'Deluxe Ocean View',
      number: '1205',
      floor: 12,
      features: ['Ocean View', 'King Bed', 'Balcony', 'WiFi']
    },
    checkIn: '2025-08-15',
    checkOut: '2025-08-18',
    nights: 3,
    guests: { adults: 2, children: 1 },
    totalAmount: '$1,250.00',
    status: 'confirmed',
    bookedDate: '2025-07-20',
    userId: 'USER001'
  },
  {
    id: 'BK002',
    bookingNumber: 'SIN-2025-002',
    hotel: {
      id: 'HTL002',
      name: 'Marina Bay Sands',
      address: '10 Bayfront Avenue, Singapore',
      stars: 5,
      image: '/src/assets/hotels/mbs.avif'
    },
    room: {
      id: 'RM002',
      type: 'Premier Room',
      number: '2804',
      floor: 28,
      features: ['City View', 'Twin Beds', 'SkyPark Access', 'WiFi']
    },
    checkIn: '2025-09-05',
    checkOut: '2025-09-07',
    nights: 2,
    guests: { adults: 2, children: 0 },
    totalAmount: '$890.00',
    status: 'pending',
    bookedDate: '2025-07-25',
    userId: 'USER001'
  },
  {
    id: 'BK003',
    bookingNumber: 'SIN-2025-003',
    hotel: {
      id: 'HTL003',
      name: 'Raffles Hotel Singapore',
      address: '1 Beach Road, Singapore',
      stars: 5,
      image: '/src/assets/hotels/raffles.jpg'
    },
    room: {
      id: 'RM003',
      type: 'Classic Room',
      number: '315',
      floor: 3,
      features: ['Heritage Suite', 'Queen Bed', 'Courtyard View', 'WiFi']
    },
    checkIn: '2025-07-10',
    checkOut: '2025-07-12',
    nights: 2,
    guests: { adults: 1, children: 0 },
    totalAmount: '$680.00',
    status: 'completed',
    bookedDate: '2025-06-15',
    userId: 'USER001'
  },
  {
    id: 'BK004',
    bookingNumber: 'SIN-2025-004',
    hotel: {
      id: 'HTL004',
      name: 'Shangri-La Hotel Singapore',
      address: '22 Orange Grove Road, Singapore',
      stars: 5,
      image: '/src/assets/hotels/shangrila.webp'
    },
    room: {
      id: 'RM004',
      type: 'Family Suite',
      number: '1108',
      floor: 11,
      features: ['Garden View', 'Two Bedrooms', 'Living Area', 'WiFi']
    },
    checkIn: '2025-08-20',
    checkOut: '2025-08-22',
    nights: 2,
    guests: { adults: 2, children: 2 },
    totalAmount: '$1,100.00',
    status: 'cancelled',
    bookedDate: '2025-07-18',
    userId: 'USER001'
  },
  {
    id: 'BK005',
    bookingNumber: 'SIN-2025-005',
    hotel: {
      id: 'HTL005',
      name: 'The Ritz-Carlton Singapore',
      address: '7 Raffles Avenue, Singapore',
      stars: 5,
      image: '/src/assets/hotels/ritzCarlton.avif'
    },
    room: {
      id: 'RM005',
      type: 'Club Level Room',
      number: '3512',
      floor: 35,
      features: ['Marina View', 'King Bed', 'Club Lounge Access', 'WiFi']
    },
    checkIn: '2025-10-01',
    checkOut: '2025-10-05',
    nights: 4,
    guests: { adults: 2, children: 0 },
    totalAmount: '$1,800.00',
    status: 'confirmed',
    bookedDate: '2025-07-28',
    userId: 'USER001'
  }
];