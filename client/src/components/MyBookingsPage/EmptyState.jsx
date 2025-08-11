import React from 'react';
import { Search } from 'lucide-react';

const EmptyState = ({ searchTerm, statusFilter }) => {
  const hasFilters = searchTerm || statusFilter !== 'all';
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="text-gray-400 mb-4">
        <Search className="h-12 w-12 mx-auto" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
      <p className="text-gray-600">
        {hasFilters 
          ? 'Try adjusting your search or filter criteria.'
          : 'You don\'t have any bookings yet. Start planning your next trip!'}
      </p>
    </div>
  );
};

export default EmptyState;