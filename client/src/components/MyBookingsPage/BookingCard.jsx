import React from 'react';
import { Calendar, MapPin, Star, Users, Clock, Bed, CreditCard } from 'lucide-react';
import { formatDate, getDaysUntilCheckIn } from './utils.js';
import StatusBadge from './StatusBadge';

const BookingCard = ({ booking }) => {
  const daysUntilCheckIn = getDaysUntilCheckIn(booking.checkIn);
  const isUpcoming = daysUntilCheckIn > 0 && booking.status === 'confirmed';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col md:flex-row">
      {/* Left side - Booking details (60% width) */}
      <div className="p-6 flex-1 md:w-3/5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{booking.hotel.name}</h3>
              <div className="flex items-center">
                {[...Array(booking.hotel.stars)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="line-clamp-1">{booking.hotel.address}</span>
            </div>
            <div className="text-sm text-gray-500">
              Booking #{booking.bookingNumber}
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Booking Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Dates */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Dates</span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatDate(booking.checkIn)}
            </div>
            <div className="text-xs text-gray-600">to {formatDate(booking.checkOut)}</div>
            <div className="text-xs text-gray-500 mt-1">{booking.nights} night{booking.nights > 1 ? 's' : ''}</div>
          </div>

          {/* Room & Guests */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Bed className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Room</span>
            </div>
            <div className="text-sm font-medium text-gray-900">{booking.room.type}</div>
            <div className="text-xs text-gray-600 mb-1">Room {booking.room.number} • Floor {booking.room.floor}</div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Users className="h-3 w-3" />
              {booking.guests.adults} adult{booking.guests.adults > 1 ? 's' : ''}
              {booking.guests.children > 0 && `, ${booking.guests.children} child${booking.guests.children > 1 ? 'ren' : ''}`}
            </div>
          </div>
        </div>

        {/* Price and Status */}
        <div className="flex items-center justify-between">
          <div className="bg-gray-50 rounded-lg p-3 min-w-[120px]">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Total</span>
            </div>
            <div className="text-lg font-bold text-gray-900">{booking.totalAmount}</div>
          </div>

          {isUpcoming && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Check-in in {daysUntilCheckIn} day{daysUntilCheckIn > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Booked on {formatDate(booking.bookedDate)}
          </div>
        </div>
      </div>

      {/* Right side - Hotel image (40% width) */}
      <div className="md:w-2/5 h-48 md:h-auto relative">
        {booking.hotel.image && (
          <img 
            src={booking.hotel.image} 
            alt={booking.hotel.name}
            className="w-full h-full object-cover"
          />
        )}
        {/* Room features as badges overlay */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {booking.room.features.slice(0, 3).map((feature) => (
            <span 
              key={feature}
              className="bg-white/90 text-xs px-2 py-1 rounded-full shadow-sm"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookingCard;