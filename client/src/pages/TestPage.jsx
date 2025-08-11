import React, { useState, useEffect } from 'react'

const TestPage = () => {

    let [posts, setPosts] = useState([]);

    useEffect(() => {
        const loadPosts = async () => {
        let results = await fetch("http://localhost:8080/api/bookingresults").then(resp => resp.json());
        console.log("this is the results", results);
        setPosts(JSON.stringify(results));
        console.log("these are the posts", posts)
        }

        loadPosts();
    }, []);

    return (
    <h2 className='py-2 mt-50'>{posts}</h2>
  )
}

export default TestPage