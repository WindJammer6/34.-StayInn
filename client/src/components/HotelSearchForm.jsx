import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { assets } from '../assets/assets';
import destinationsData from '../assets/destinations.json';

const maxRooms = 5;
const minRooms = 1;
const maxGuestsPerRoom = 4;
const minGuestsPerRoom = 1;
const maxTotalGuests = 10;

// Helper to format date as 'YYYY-MM-DD'
function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

const HotelSearchForm = ({ 
  initialDestination = '',
  initialDestinationId = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialRooms = 1,
  initialGuestsPerRoom = 2 
}) => {
  const navigate = useNavigate();

  // State for destinations and user inputs
  const [destinations, setDestinations] = useState([]);
  const [searchTerm, setSearchTerm] = useState(initialDestination);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(initialDestination);
  const [selectedUID, setSelectedUID] = useState(initialDestinationId);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [minCheckIn, setMinCheckIn] = useState('');
  const worker = useRef(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // For room and guest quantity
  const [rooms, setRooms] = useState(initialRooms);
  const [guestsPerRoom, setGuestsPerRoom] = useState(initialGuestsPerRoom);
  const totalGuests = rooms * guestsPerRoom;

  // On mount, filter out any destinations without a valid `term`
  useEffect(() => {
    const valid = destinationsData.filter(d => typeof d.term === 'string');
    setDestinations(valid);
  }, []);

  // Set up Web Worker autocomplete with valid destinations
  useEffect(() => {
    if (destinations.length === 0) return;

    worker.current = new Worker(new URL('../workers/autocompleteworker.js', import.meta.url), {
      type: 'module',
    });

    worker.current.postMessage({
      type: "init",
      payload: destinations,
    });

    worker.current.onmessage = (e) => {
      if (!selectedTerm){
        setSuggestions(e.data.results);
      }
    };

    return () => worker.current?.terminate();
  }, [destinations, selectedTerm]);

  // Send search term to worker for autocomplete
  useEffect(() => {
    if (worker.current && searchTerm.trim().length > 0 && searchTerm !== selectedTerm) {
      const timeout = setTimeout(() => {
        worker.current.postMessage({
          type: "search",
          payload: searchTerm,
        });
      }, 100);
      return () => clearTimeout(timeout);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, selectedTerm]);

  // When user clicks a suggestion
  const handleSelectDestination = (destination) => {
    setSearchTerm(destination.term);
    setSelectedTerm(destination.term);
    setSelectedUID(destination.uid);
    setSuggestions([]);
  };

  // Compute minimum check-in date (today)
  useEffect(() => {
    const now = new Date();
    setMinCheckIn(formatDate(now));
  }, []);

  // Compute room and guests logic
  const handleRoomChange = (delta) => {
    setRooms(prev => {
      let next = prev + delta;
      if (next < minRooms) next = minRooms;
      if (next > maxRooms) next = maxRooms;
      if (next * guestsPerRoom > maxTotalGuests) return prev;
      return next;
    });
  };

  const handleGuestsPerRoomChange = (delta) => {
    setGuestsPerRoom(prev => {
      let next = prev + delta;
      if (next < minGuestsPerRoom) next = minGuestsPerRoom;
      if (next > maxGuestsPerRoom) next = maxGuestsPerRoom;
      if (rooms * next > maxTotalGuests) return prev;
      return next;
    });
  };

  // Form validation
  const isFormValid =
    searchTerm.trim() &&
    destinations.find(
      (d) => typeof d.term === 'string' && d.term.toLowerCase().trim() === searchTerm.toLowerCase().trim()
    ) &&
    checkIn &&
    checkOut &&
    checkIn >= minCheckIn &&
    checkOut > checkIn &&
    rooms >= minRooms &&
    rooms <= maxRooms &&
    guestsPerRoom >= minGuestsPerRoom &&
    guestsPerRoom <= maxGuestsPerRoom &&
    totalGuests <= maxTotalGuests &&
    totalGuests >= rooms;

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setHasSubmitted(true);

    const trimmedInput = (searchTerm || "").toLowerCase().trim();

    // Find destination from JSON file that matches user input exactly
    const matchedDestination = destinations.find(
      (d) => typeof d.term === "string" && d.term.toLowerCase().trim() === trimmedInput
    );

    if (
      !matchedDestination ||
      !checkIn ||
      !checkOut ||
      checkIn < minCheckIn ||
      checkOut <= checkIn ||
      totalGuests > maxTotalGuests ||
      totalGuests < rooms
    ) {
      return;
    }

    // Navigate to hotels page with new search parameters
    navigate("/rooms", {
      state: {
        destinationId: matchedDestination.uid,
        checkIn,
        checkOut,
        currency: "SGD",
        countryCode: "SG",
        guestsPerRoom: guestsPerRoom,
        rooms,
        lang: "en_US",
        destLabel: matchedDestination.term,
      },
    });
  };

  // Error handling
  const destError = (() => {
    if (!hasSubmitted) return '';
    if (searchTerm.trim() === '') return 'Please choose a destination from the list.';
    if (!destinations.find(
      d => typeof d.term === "string" && d.term.toLowerCase().trim() === searchTerm.toLowerCase().trim()
    )) {
      return 'Please choose a destination from the list.';
    }
    return '';
  })();

  const checkInError = hasSubmitted && checkIn && checkIn < minCheckIn
    ? `Check-in date can't be before ${minCheckIn}`
    : '';
  const checkOutError = hasSubmitted && checkOut && (checkOut <= checkIn)
    ? 'Check-out date cannot be before or equal to check-in date.'
    : '';

  const guestRoomError = (() => {
    if (!hasSubmitted) return '';
    if (totalGuests < rooms) return 'Each room must have at least 1 guest.';
    if (totalGuests > maxTotalGuests) return `Total guests cannot exceed ${maxTotalGuests}.`;
    return '';
  })();

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
          
          {/* Destination Input */}
          <div className="relative flex-1">
            <div className="flex items-center gap-2 mb-1">
              <img src={assets.searchIcon} alt="" className="h-4" />
              <label htmlFor="destinationInput" className="block text-sm font-medium">Destination</label>
            </div>
            <input
              id="destinationInput"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHasSubmitted(false);
                setSelectedTerm('');
              }}
              placeholder="Type a city or hotel"
              className="w-full border rounded-md px-3 py-2"
              autoComplete="off"
            />
            
            {destError && (
              <div className="text-red-500 text-xs mt-1">{destError}</div>
            )}

            {/* Autocomplete suggestions */}
            {suggestions.length > 0 && (
              <ul className="absolute bg-white text-black shadow rounded w-full mt-1 z-10 max-h-52 overflow-y-auto border">
                {suggestions.map((d, i) => (
                  <li
                    key={`${d.uid}-${i}`}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handleSelectDestination(d)}
                  >
                    {d.term} <span className="text-xs text-gray-400">({d.type})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Check-in Date */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <img src={assets.calenderIcon} alt="" className="h-4" />
              <label htmlFor="checkIn" className="block text-sm font-medium">Check-in</label>
            </div>
            <input
              id="checkIn"
              type="date"
              value={checkIn}
              min={minCheckIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value > checkOut) setCheckOut(e.target.value);
                setHasSubmitted(false);
              }}
              className="w-full border rounded-md px-3 py-2"
              required
            />
            {checkInError && (
              <div className="text-red-500 text-xs mt-1">{checkInError}</div>
            )}
          </div>

          {/* Check-out Date */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <img src={assets.calenderIcon} alt="" className="h-4" />
              <label htmlFor="checkOut" className="block text-sm font-medium">Check-out</label>
            </div>
            <input
              id="checkOut"
              type="date"
              value={checkOut}
              min={
                checkIn
                  ? (() => {
                      const d = new Date(checkIn);
                      d.setDate(d.getDate() + 1);
                      return d.toISOString().slice(0, 10);
                    })()
                  : minCheckIn
              }
              onChange={(e) => {
                setCheckOut(e.target.value);
                setHasSubmitted(false);
              }}
              className="w-full border rounded-md px-3 py-2"
              required
            />
            {checkOutError && (
              <div className="text-red-500 text-xs mt-1">{checkOutError}</div>
            )}
          </div>

          {/* Rooms and Guests */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Rooms & Guests</label>
            <div className="flex flex-col gap-2 p-2 border rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm">Rooms</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoomChange(-1)}
                    disabled={rooms <= minRooms}
                    className="w-6 h-6 rounded bg-gray-200 text-sm font-bold flex items-center justify-center disabled:opacity-50"
                  >–</button>
                  <span className="w-4 text-center text-sm">{rooms}</span>
                  <button
                    type="button"
                    onClick={() => handleRoomChange(1)}
                    disabled={rooms >= maxRooms || rooms * guestsPerRoom >= maxTotalGuests}
                    className="w-6 h-6 rounded bg-gray-200 text-sm font-bold flex items-center justify-center disabled:opacity-50"
                  >+</button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Guests per room</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGuestsPerRoomChange(-1)}
                    disabled={guestsPerRoom <= minGuestsPerRoom}
                    className="w-6 h-6 rounded bg-gray-200 text-sm font-bold flex items-center justify-center disabled:opacity-50"
                  >–</button>
                  <span className="w-4 text-center text-sm">{guestsPerRoom}</span>
                  <button
                    type="button"
                    onClick={() => handleGuestsPerRoomChange(1)}
                    disabled={guestsPerRoom >= maxGuestsPerRoom || rooms * (guestsPerRoom + 1) > maxTotalGuests}
                    className="w-6 h-6 rounded bg-gray-200 text-sm font-bold flex items-center justify-center disabled:opacity-50"
                  >+</button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Total: {totalGuests} guests
              </div>
            </div>
            {guestRoomError && (
              <div className="text-red-500 text-xs mt-1">{guestRoomError}</div>
            )}
          </div>

          {/* Search Button */}
          <Button 
            type="submit" 
            disabled={!isFormValid}
            className="self-end lg:self-auto whitespace-nowrap h-10 lg:h-auto"
          >
            Search Again
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default HotelSearchForm;
