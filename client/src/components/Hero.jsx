import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// import Fuse from 'fuse.js'; // Optional, not needed if using simple worker
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

const Hero = () => {
  const navigate = useNavigate();

  // State for destinations and user inputs
  const [destinations, setDestinations] = useState([]); // only valid destinations
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedUID, setSelectedUID] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [minCheckIn, setMinCheckIn] = useState('');
  const worker = useRef(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // For room and guest quantity
  const [rooms, setRooms] = useState(1);
  const [guestsPerRoom, setGuestsPerRoom] = useState(2); // default to 2 guests
  const totalGuests = rooms * guestsPerRoom;

  // On mount, filter out any destinations without a valid `term` (defensive)
  useEffect(() => {
    const valid = destinationsData.filter(d => typeof d.term === 'string');
    setDestinations(valid);
  }, []);

  // Set up Web Worker autocomplete with valid destinations
  useEffect(() => {
    worker.current = new Worker(new URL('../workers/autocompleteworker.js', import.meta.url), {
      type: 'module',
    });

    worker.current.postMessage({
      type: "init",
      payload: destinations,
    });

    worker.current.onmessage = (e) => {
      setSuggestions(e.data.results);
    };

    return () => worker.current.terminate();
  }, [destinations]);

  // Send search term to worker for autocomplete
  useEffect(() => {
    if (worker.current && searchTerm.trim().length > 0) {
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
  }, [searchTerm]);

  // When user clicks a suggestion
  const handleSelectDestination = (destination) => {
    setSearchTerm(destination.term);
    setSelectedTerm(destination.term);
    setSelectedUID(destination.uid);
    setSuggestions([]);
  };

  // Compute minimum check-in date (3 days from today)
  useEffect(() => {
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() + 3);
    setMinCheckIn(formatDate(minDate));
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

  // Form validation for all
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

    // Find destination from JSON file that matches user input *exactly*
    const matchedDestination = destinations.find(
      (d) => typeof d.term === "string" && d.term.toLowerCase().trim() === trimmedInput
    );

    if (
      !matchedDestination ||  // Don't allow search, show error in UI
      !checkIn ||
      !checkOut ||
      checkIn < minCheckIn || // Validate check-in date is at least minCheckIn (3 days from today)
      checkOut <= checkIn ||  // Validate check-out date is same or after check-in date
      totalGuests > maxTotalGuests ||
      totalGuests < rooms     // Validate # rooms / # guests
    ) {
      // Show inline error
      return;
    }

    // to feature2 when all validation passed
    navigate(
      `/search-results?uid=${matchedDestination.uid}` +
      `&checkin=${checkIn}` +
      `&checkout=${checkOut}` +
      `&rooms=${rooms}` +
      `&guestsPerRoom=${guestsPerRoom}`
    );
  };

  // Show error below destination input if submitting and input empty or not in list
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

  // Show error below check-in or check-out if submit is invalid
  const checkInError = hasSubmitted && checkIn && checkIn < minCheckIn
    ? `Check-in date can't be before ${minCheckIn}`
    : '';
  const checkOutError = hasSubmitted && checkOut && (checkOut <= checkIn)
    ? 'Check-out date cannot be before or equal to check-in date.'
    : '';

  // Show error if guests and rooms is invalid quantity
  const guestRoomError = (() => {
  if (!hasSubmitted) return '';
  if (totalGuests < rooms) return 'Each room must have at least 1 guest.';
  if (totalGuests > maxTotalGuests) return `Total guests cannot exceed ${maxTotalGuests}.`;
  return '';
  })();


  return (
    <div className='flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 xl:px-32 text-white bg-[url("/src/assets/heroImage.png")] bg-no-repeat bg-cover bg-center h-screen'>

      {/* Title */}
      <h1 className='font-playfair text-2xl md:text-5xl font-bold max-w-xl mt-4'>
        Chase elegance. Reserve your dream stay now.
      </h1>
      <p className='max-w-130 mt-4 text-sm md:text-base'>
        Discover the finest hotels from all over the world
      </p>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className='bg-white text-gray-600 rounded-lg px-6 py-4 mt-9 flex flex-col md:flex-row gap-4'>

        {/* 🔍 Destination Input */}
        <div className='relative w-full md:w-[200px]'>
          <div className='flex items-center gap-2'>
            <img src={assets.searchIcon} alt='' className='h-4' />
            <label htmlFor='destinationInput'>Destination</label>
          </div>
          <input
            id='destinationInput'
            type='text'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setHasSubmitted(false);
            }}
            placeholder='Type a city or hotel'
            className='rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none w-full'
            autoComplete='off'
          />

          {/* Destination errors */}
          {destError && (
            <div style={{ color: 'red', fontSize: '0.8rem' }}>{destError}</div>
          )}

          {/* Suggested autocomplete list */}
          {suggestions.length > 0 && (
            <ul className='absolute bg-white text-black shadow rounded w-full mt-1 z-10 max-h-52 overflow-y-auto'>
              {suggestions.map((d, i) => (
                <li
                  key={`${d.uid}-${i}`}
                  className='px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm'
                  onClick={() => handleSelectDestination(d)}
                >
                  {d.term} <span className='text-xs text-gray-400'>({d.type})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Check-in Date */}
        <div>
          <div className='flex items-center gap-2'>
            <img src={assets.calenderIcon} alt='' className='h-4' />
            <label htmlFor='checkIn'>Check-in</label>
          </div>
          <input
            id='checkIn'
            type='date'
            value={checkIn}
            min={minCheckIn}
            onChange={(e) => {
              setCheckIn(e.target.value);

              // Optionally auto-adjust checkOut if earlier
              if (checkOut && e.target.value > checkOut) setCheckOut(e.target.value);
              setHasSubmitted(false);
            }}
            className='rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none'
            required
          />
          {checkInError && (
            <div style={{ color: 'red', fontSize: '0.8rem' }}>{checkInError}</div>
          )}
        </div>

        {/* Check-out Date */}
        <div>
          <div className='flex items-center gap-2'>
            <img src={assets.calenderIcon} alt='' className='h-4' />
            <label htmlFor='checkOut'>Check-out</label>
          </div>
          <input
            id='checkOut'
            type='date'
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
            className='rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none'
            required
          />
          {checkOutError && (
            <div style={{ color: 'red', fontSize: '0.8rem' }}>{checkOutError}</div>
          )}
        </div>

        {/* Rooms & Guests per room */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label>Rooms</label>
            <button
              type="button"
              onClick={() => handleRoomChange(-1)}
              disabled={rooms <= minRooms}
              className="w-7 h-7 rounded bg-gray-200 text-lg font-bold flex items-center justify-center"
              aria-label="Decrease rooms"
            >–</button>
            <span className="w-6 text-center">{rooms}</span>
            <button
              type="button"
              onClick={() => handleRoomChange(1)}
              disabled={rooms >= maxRooms || rooms * guestsPerRoom >= maxTotalGuests}
              className="w-7 h-7 rounded bg-gray-200 text-lg font-bold flex items-center justify-center"
              aria-label="Increase rooms"
            >+</button>
          </div>

          <div className="flex items-center gap-2">
            <label>Guests per room</label>
            <button
              type="button"
              onClick={() => handleGuestsPerRoomChange(-1)}
              disabled={guestsPerRoom <= minGuestsPerRoom}
              className="w-7 h-7 rounded bg-gray-200 text-lg font-bold flex items-center justify-center"
              aria-label="Decrease guests per room"
            >–</button>
            <span className="w-6 text-center">{guestsPerRoom}</span>
            <button
              type="button"
              onClick={() => handleGuestsPerRoomChange(1)}
              disabled={guestsPerRoom >= maxGuestsPerRoom || rooms * (guestsPerRoom + 1) > maxTotalGuests}
              className="w-7 h-7 rounded bg-gray-200 text-lg font-bold flex items-center justify-center"
              aria-label="Increase guests per room"
            >+</button>
          </div>

          {/* Display total number of guests */}
          <div className="pt-1 text-xs text-gray-500 flex items-center gap-2">
            <span>
              Total guests: {totalGuests}
              {totalGuests >= maxTotalGuests && " (max reached)"}
            </span>
            {guestRoomError && (
              <span style={{ color: 'red', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                {guestRoomError}
              </span>
            )}
          </div>
        </div>

        {/* Search Button */}
        <button
          type='submit'
          disabled={!isFormValid}
          className={`flex items-center justify-center gap-2 rounded-md py-3 px-4 my-auto h-fit ${
          isFormValid ? 'bg-black text-white cursor-pointer' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          <img src={assets.searchIcon} alt='searchIcon' className='h-5' />
          <span>Search</span>
        </button>
      </form>
    </div>
  );
};

export default Hero;
