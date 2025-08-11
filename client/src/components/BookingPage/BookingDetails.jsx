import React from 'react';

const BookingDetails = ({ booking, pricing }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h3>
    
    <div className="space-y-6">
      {/* Dates */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Check-in</div>
            <div className="font-semibold text-gray-900">{booking.checkIn}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Check-out</div>
            <div className="font-semibold text-gray-900">{booking.checkOut}</div>
          </div>
        </div>
      </div>
      
      {/* Room Details */}
      <div className="border-l-4 border-blue-500 pl-4">
        <h4 className="font-semibold text-gray-900">{booking.roomType}</h4>
        <p className="text-sm text-gray-600 mt-1">
          {booking.nights} night{booking.nights > 1 ? 's' : ''} • {booking.guests} guest{booking.guests > 1 ? 's' : ''}
        </p>
      </div>

      {/* Pricing */}
      <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-blue-600">${pricing.total}</span>
        </div>
      </div>
    </div>
  </div>
);

export default BookingDetails;