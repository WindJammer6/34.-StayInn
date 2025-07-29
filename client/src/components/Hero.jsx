import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { assets } from '../assets/assets';

import destinationsData from '../assets/destinations.json'; // assuming the destinations file is in src/assets

const Hero = () => {
    const navigate = useNavigate();

    // Helper to format date as 'YYYY-MM-DD'
    function formatDate(date) {
        return date.toISOString().slice(0, 10);
    }

    // State for destinations and user inputs
    const [destinations, setDestinations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedTerm, setSelectedTerm] = useState(''); // holds selected destination text
    const [selectedUID, setSelectedUID] = useState('');   // holds UID of selected destination
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);
    const [rooms, setRooms] = useState(1);
    const [minCheckIn, setMinCheckIn] = useState('');
    const worker = useRef(null);
    const workerRequestId = useRef(0);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Load destinations from JSON into state once
    useEffect(() => {
        setDestinations(destinationsData);
    }, []);

    // Set up Web Worker to handle fuzzy search autocomplete
    useEffect(() => {
        worker.current = new Worker(new URL('../workers/autocompleteworker.js', import.meta.url), {
            type: 'module',
        });

        // Init the worker with data
        worker.current.postMessage({
            type: "init",
            payload: destinations,
        });
        
        // Handle results
        worker.current.onmessage = (e) => {
            setSuggestions(e.data.results);
        };

        // Cleanup
        return () => worker.current.terminate();
    }, [destinations]);

    // Run fuzzy search on searchTerm input changes
    useEffect(() => {
        // debounces input, prevents spamming worker with messages
        const timeout = setTimeout(() => {
            // let worker handle fuzzy search (prevents frontend lag)
            worker.current.postMessage({
                type: "search",
                payload: searchTerm,
            });
        }, 100);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    // When user clicks a suggestion
    const handleSelectDestination = (destination) => {
        setSearchTerm(destination.term);     // updates input box
        setSelectedTerm(destination.term);   // stores which text value was selected
        setSelectedUID(destination.uid);     // stores UID to be sent later
        setSuggestions([]);
    };

    // Compute minimum check-in date (3 days from today)
    useEffect(() => {
        const now = new Date();
        const minDate = new Date(now);
        minDate.setDate(minDate.getDate() + 3);
        setMinCheckIn(formatDate(minDate));
    }, []);

    // Form submission handler
    const handleSubmit = (e) => {
        e.preventDefault();
        setHasSubmitted(true); // Track submission for showing inline errors

        // Get trimmed and lowercase version of user input for matching
        const trimmedInput = (searchTerm || "").toLowerCase().trim();

        // Find destination from JSON file that matches user input *exactly*
        const matchedDestination = destinations.find(
            (d) => typeof d.term === "string" && d.term.toLowerCase().trim() === trimmedInput
        );

        if (!matchedDestination) {
            alert('Please choose a destination from the list.');
            return;  // prevent navigate call below
        }

        // Validate check-in date is at least minCheckIn
        if (checkIn < minCheckIn) {
            alert(`Check-in date can't be before ${minCheckIn}`);
            return;
        }

        // Validate check-out date is same or after check-in date
        if (checkOut < checkIn) {
            alert('Check-out date cannot be before check-in date.');
            return;
        }

        // Only call navigate if matchedDestination is valid
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
                        autoComplete='off'
                    />

                    {/* Show error if user click search button but destination input empty */}
                    {hasSubmitted && searchTerm.trim() === '' && (
                        <p style={{ color: 'red', fontSize: '0.8rem' }}>
                            Please choose a destination from the list.
                        </p>
                    )}

                    {/* Show error when user submits destination input that is not from JSON data */}
                    {hasSubmitted && searchTerm.trim() !== '' &&
                        !destinations.find(d => typeof d.term === "string" &&
                            d.term.toLowerCase().trim() === searchTerm.toLowerCase().trim()) && (
                            <p style={{ color: 'red', fontSize: '0.8rem' }}>
                                Please choose a destination from the list.
                            </p>
                        )}

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
                        min={minCheckIn}
                        onChange={(e) => {
                            setCheckIn(e.target.value);
                            // Optionally update checkOut if earlier than new checkIn
                            if (checkOut && e.target.value > checkOut) setCheckOut(e.target.value);
                        }}
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
                        min={
                            checkIn
                                ? (() => {
                                    const d = new Date(checkIn);
                                    d.setDate(d.getDate() + 1);
                                    return d.toISOString().slice(0, 10);
                                })()
                                : minCheckIn
                        }
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