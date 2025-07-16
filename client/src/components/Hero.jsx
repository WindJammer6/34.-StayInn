import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { assets } from '../assets/assets';

import destinationsData from '../assets/destinations.json'; // assuming the destinations file is in src/assets

const Hero = () => {
  const navigate = useNavigate();

  // State for destinations and user inputs
  const [destinations, setDestinations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(''); // holds selected destination text
  const [selectedUID, setSelectedUID] = useState('');   // holds UID of selected destination
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);

  // Load destinations from JSON into state
  useEffect(() => {
    setDestinations(destinationsData);
  }, []);

  // Set up Fuse.js for fuzzy matching search
  const fuse = new Fuse(destinations, {
    keys: ['term'],
    threshold: 0.3, // controls typo tolerance
  });

  // Run fuzzy search on searchTerm input changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      setSelectedUID(''); // clear UID if input is cleared
      return;
    }

    // use fuse to assign searchTerm to results and map destination from dest.json file to fuse result r
    // r stands for result - is a variable name used in the .map()
    const results = fuse.search(searchTerm);
    const items = results.map((r) => r.item);
    setSuggestions(items.slice(0, 8));
  }, [searchTerm]);

  // When user clicks a suggestion
  const handleSelectDestination = (destination) => {
    setSearchTerm(destination.term);     // updates input box
    setSelectedTerm(destination.term);   // stores which text value was selected
    setSelectedUID(destination.uid);     // stores UID to be sent later
    setSuggestions([]);
  };

  // form submission handler
  const handleSubmit = (e) => {
  e.preventDefault();

  const matchedDestination = destinations.find(
    (d) => d.term.toLowerCase() === searchTerm.toLowerCase()
  );

  if (!matchedDestination) {
    alert('Please choose a destination from the list.');
    return;
  }

  // Redirect with valid destination and browser-validated fields
  navigate(
    `/search-results?uid=${matchedDestination.uid}&checkin=${checkIn}&checkout=${checkOut}&guests=${guests}&rooms=${rooms}`
  );
};


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
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Type a city or hotel'
            className='rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none w-full'
          />

          {/* Suggested autocomplete list */}
          {suggestions.length > 0 && (
            <ul className='absolute bg-white text-black shadow rounded w-full mt-1 z-10 max-h-52 overflow-y-auto'>
              {suggestions.map((d) => (
                <li
                  key={d.uid}
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
            onChange={(e) => setCheckIn(e.target.value)}
            className='rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none'
            required
          />
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
            onChange={(e) => setCheckOut(e.target.value)}
            className='rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none'
            required
          />
        </div>

        {/* Guests - can change min and max accordingly */}
        <div className='flex md:flex-col gap-1 items-center md:items-start'>
          <label htmlFor='guests'>Guests</label>
          <input
            id='guests'
            type='number'
            min={1}
            max={10}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className='rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none w-[60px]'
          />
        </div>

        {/* Rooms */}
        <div className='flex md:flex-col gap-1 items-center md:items-start'>
          <label htmlFor='rooms'>Rooms</label>
          <input
            id='rooms'
            type='number'
            min={1}
            max={5}
            value={rooms}
            onChange={(e) => setRooms(Number(e.target.value))}
            className='rounded border border-gray-200 px-3 py-1.5 mt-1.5 text-sm outline-none w-[60px]'
          />
        </div>

        {/* Search Button */}
        <button
          type='submit'
          className='flex items-center justify-center gap-2 rounded-md bg-black py-3 px-4 text-white cursor-pointer my-auto h-fit'
        >
          <img src={assets.searchIcon} alt='searchIcon' className='h-5' />
          <span>Search</span>
        </button>

      </form>
    </div>
  );
};

export default Hero;
