"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react"; // Importing the search icon

export default function Dashboard() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [musicRecommendations, setMusicRecommendations] = useState([]);
    const [playlist, setPlaylist] = useState([]); // State for playlists
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [accessToken, setAccessToken] = useState("");

    // Check for access token on component mount
    useEffect(() => {
        const token = Cookies.get("access_token");
        if (!token) {
            router.push("/login");
        } else {
            setAccessToken(token);
            fetchMusicRecommendations();
            fetchPlaylists(); // Fetch playlists on component mount
        }
    }, []);

    // Fetch music recommendations from the backend
    const fetchMusicRecommendations = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/model/recommendations", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.json();
                setMusicRecommendations(data.recommendations);
            } else {
                toast.error("Failed to fetch music recommendations.");
            }
        } catch (error) {
            toast.error("Error fetching recommendations.");
        }
    };

    // Fetch playlists from the backend
    const fetchPlaylists = async () => {
        try {
            const response = await fetch("http://127.0.0.1:8000/model/playlists", { // Adjust endpoint as necessary
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                const data = await response.json();
                setPlaylist(data.playlists);
            } else {
                toast.error("Failed to fetch playlists.");
            }
        } catch (error) {
            toast.error("Error fetching playlists.");
        }
    };

    // Handle search functionality
    const handleSearch = async (e) => {
        e.preventDefault();
        console.log("Searching for:", searchQuery);
        // Implement search logic here
        // You can call an API to get search results based on the query
    };

    // Function to play selected track
    const playTrack = (track) => {
        setSelectedTrack(track);
        console.log("Playing track:", track);
        // Here you can implement the logic to play the selected track
    };

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-6">
            <ToastContainer />
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex items-center mb-8">
                <input 
                    type="text" 
                    placeholder="Search for music..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="flex-grow p-4 bg-white/10 border border-white/20 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required 
                />
                <button type="submit" className="ml-2 p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:scale-105 transition-all">
                    <Search size={20} />
                </button>
            </form>

            {/* Music Player Section */}
            {selectedTrack && (
                <div className="mt-8 w-full max-w-lg p-4 bg-white/10 border border-white/20 rounded-lg">
                    <h2 className="text-xl font-bold">Now Playing</h2>
                    <p>{selectedTrack.title}</p>
                    {/* Add your audio player component here */}
                </div>
            )}

            {/* Music Recommendations */}
            <h2 className="text-xl font-bold mt-8">Recommended For You</h2>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {musicRecommendations.map((track) => (
                    <motion.div 
                        key={track.id} 
                        className="flex flex-col items-center p-4 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20"
                        onClick={() => playTrack(track)}
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ duration: 0.5 }}
                    >
                        <img src={track.coverImage} alt={track.title} className="w-full h-auto rounded-md mb-2" />
                        <h3 className="text-lg font-semibold">{track.title}</h3>
                        <p className="text-sm text-gray-400">{track.artist}</p>
                    </motion.div>
                ))}
            </div>

            {/* Playlists Section */}
            <h2 className="text-xl font-bold mt-8">Your Playlists</h2>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {playlist.map((pl) => (
                    <motion.div 
                        key={pl.id} 
                        className="flex flex-col items-center p-4 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20"
                        onClick={() => console.log(`Opening playlist: ${pl.name}`)} // Placeholder action for playlist click
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        transition={{ duration: 0.5 }}
                    >
                        <img src={pl.coverImage} alt={pl.name} className="w-full h-auto rounded-md mb-2" />
                        <h3 className="text-lg font-semibold">{pl.name}</h3>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
