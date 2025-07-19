// src/components/HotelList.jsx
import React from "react";
import HotelCard from "./HotelCard";

export default function HotelList({ hotels, checkin, checkout }) {
  return (
    <ul className="flex flex-col gap-6 max-w-5xl mx-auto">
      {hotels.map((hotel) => (
        <HotelCard
          key={hotel.id}
          hotel={hotel}
          checkin={checkin}
          checkout={checkout}
        />
      ))}
    </ul>
  );
}