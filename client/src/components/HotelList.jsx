// src/components/HotelList.jsx
import React from "react";
import { Link } from "react-router-dom";   // ⬅ make cards clickable
import starFilled from "../assets/starIconFilled.svg";

const HotelList = ({ hotels = [] }) => (
  <div className="mt-10 mb-12">
    <ul className="flex flex-col gap-6 max-w-5xl mx-auto">
      {hotels.map((hotel) => {
        const stars       = Math.round(hotel.rating || 0);
        const guestScore  = hotel.trustyou?.score?.overall ?? null;
        const imageUrl    =
          hotel.image_details.prefix +
          "0" +
          hotel.image_details.suffix;

        return (
          <li key={hotel.id}>
            {/* ── Entire card is a Link ───────────────────────── */}
            <Link
              to={`/detail?id=${hotel.id}`}           // change target as needed
              className="flex flex-col md:flex-row bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 hover:shadow-md transition w-full"
            >
              {/* Image */}
              <div className="w-full md:w-56 shrink-0">
                <img
                  src={imageUrl}
                  alt={hotel.name}
                  className="h-48 w-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                />
              </div>

              {/* Content */}
              <div className="flex-1 p-6 flex flex-col gap-2">
                {/* Name + score badge */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{hotel.name}</h2>
                    {guestScore && (
                      <span className="px-2.5 py-1 bg-green-600 text-white text-sm rounded-md font-semibold">
                        {(guestScore / 10).toFixed(1)}
                      </span>
                    )}
                  </div>
                    <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
                      {/* location pin SVG (12 × 12) */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-3 h-3 text-red-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2C7.6 2 4 5.5 4 9.8c0 5 6.4 11.6 7.1 12.3a1 1 0 0 0 1.4 0c.7-.7 7.1-7.3 7.1-12.3C20 5.5 16.4 2 12 2Zm0 10.3a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {hotel.address}
                    </p>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                    {Array.from({ length: stars }).map((_, i) => (
                    <img key={i} src={starFilled} alt="★" className="w-4 h-4" />
                    ))}
                  <span className="ml-1 text-gray-700">({hotel.rating.toFixed(1)})</span>
                </div>

                {/* Short description */}
                {hotel.description && (
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {hotel.description.split(".")[0]}.
                  </p>
                )}

                <div className="border-t my-2" />

                {/* Bottom meta row */}
                {hotel.distance && (
                  <span className="text-sm text-gray-500">
                    {(hotel.distance / 1000).toFixed(1)} km away
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  </div>
);

export default HotelList;
