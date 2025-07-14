import React from 'react'
import { Link } from "react-router-dom";
import {assets, cities} from "../assets/assets";
import HotelList from '@/components/HotelList';

let hotels = [];

fetch('/testhotels.json')
    .then(response => response.json()) // Parse JSON
    .then(json => {
      hotels = json.hotels;
      console.log(json.hotels);
    }) // Work with JSON data
    .catch(error => console.error('Error fetching JSON:', error));

export const Hotels = () => {
  // return <div className="mt-24">List of Hotels</div>;
  return (
    <HotelList hotels={hotels}/>
  );
  
};

export default Hotels;
