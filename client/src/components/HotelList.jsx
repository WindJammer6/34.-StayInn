import React from 'react'
import { Link } from "react-router-dom";
import {assets, cities} from "../assets/assets";
import starFilled from '../assets/starIconFilled.svg';
import starOutlined from '../assets/starIconOutlined.svg';

const HotelList = ({hotels}) => {
    return (
        <div className='mt-100 mb-10'>
            <ul className="flex flex-col min-h-screen justify-start items-center space-y-4">
                {hotels.map((hotel) => (        
                <a href="#" className="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow-sm md:flex-row md:max-w-5xl hover:bg-gray-100 w-4/5" key={hotel.id}>
                    <img className="object-cover w-full rounded-t-lg h-96 md:h-48 md:w-48 md:rounded-none md:rounded-s-lg" src={hotel.image_details.prefix + "0" + hotel.image_details.suffix} alt=""></img>
                    <div className="flex flex-col justify-between p-8 leading-normal">
                        <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">{hotel.name}</h1>
                        <p className="mb-3 font-normal text-gray-700">{hotel.address}</p>
                    </div>
                    <div className="flex flex-row justify-end-safe p-8 leading-normal ml-auto">
                        {/* <p className="mb-3 text-xl font-normal text-gray-700">{hotel.rating + "/5"}</p> */}
                        {new Array(hotel.rating).fill('').map((rating) => (
                            <img src={starFilled}></img>
                        ))}
                    </div>
                </a>
                ))}
            </ul>
        </div>
    )
}

export default HotelList