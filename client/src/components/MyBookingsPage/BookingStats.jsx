import React from 'react';

const BookingStats = ({ stats }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
      <div className="flex items-center">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{stats.booked}</div>
          <div className="text-xs text-gray-600">Booked Rooms</div>
        </div>
      </div>
    </div>
  );
};

export default BookingStats;