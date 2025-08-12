import React from 'react';
import { Star, MapPin } from 'lucide-react';

const HotelCard = ({ hotel }) => {

  const imageSrc = hotel.image || '/src/assets/hotels/fullertonHotel.jpg';
  const name = hotel.name || "Hilton Hotel";
  const rating = hotel.rating || "N/A";
  const stars = Number(hotel.stars) || 4;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Image Section */}
      <div className="h-40 w-full overflow-hidden rounded-t-xl">
        <img
          src={imageSrc}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Hotel Info Section */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold">{hotel.name}</h3>
          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            {hotel.rating} ★
          </div>
        </div>
        
        <div className="flex items-center mb-2">
          {[...Array(hotel.stars)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        
        <div className="flex items-start text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1 mt-0.5" />
          <span className="text-sm">{hotel.address}</span>
        </div>
      </div>
    </div>
  );


  // <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  //   <div className="h-40 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 relative">
  //     <div className="absolute inset-0 bg-black bg-opacity-20"></div>
  //     <div className="absolute bottom-4 left-4">
  //       <div className="bg-white bg-opacity-90 px-2 py-1 rounded-md text-xs font-medium text-gray-800">
  //         Featured Hotel
  //       </div>
  //     </div>
  //   </div>
  //   <div className="p-6">
  //     <div className="flex justify-between items-start mb-3">
  //       <h3 className="text-xl font-bold text-gray-900">{hotel.name}</h3>
  //       <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
  //         {hotel.rating} ★
  //       </div>
  //     </div>
      
  //     <div className="flex items-start text-gray-600 mb-4">
  //       <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
  //       <span className="text-sm leading-relaxed">{hotel.address}</span>
  //     </div>
      
  //     <div className="grid grid-cols-2 gap-3 text-sm">
  //       {hotel.amenities.map((amenity, i) => (
  //         <div key={i} className="flex items-center text-gray-600">
  //           <span className="text-green-600 mr-2">{amenity.icon}</span>
  //           <span>{amenity.name}</span>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // </div>
};

export default HotelCard;