// src/components/HotelList.jsx
import React from "react";
import HotelCard from "./HotelCard";

export default function HotelList({ 
  hotels, 
  checkin, 
  checkout,
  dest,
  inDate,
  outDate,
  guests,
  currency,
  countryCode,
  lang,
  destLabel
}) {
  return (
    <ul className="flex flex-col gap-6 max-w-5xl mx-auto">
      {hotels.map((hotel) => (
        <HotelCard 
          key={hotel.id}
          hotel={hotel}
          checkin={checkin}
          checkout={checkout}
          dest={dest}
          inDate={inDate}
          outDate={outDate}
          guests={guests}
          currency={currency}
          countryCode={countryCode}
          lang={lang}
          destLabel={destLabel}
        />
      ))}
    </ul>
  );
}