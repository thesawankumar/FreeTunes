"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import {Search } from "lucide-react";
import Link from "next/link";
import ReactAudioPlayer from 'react-h5-audio-player'
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import Hls from "hls.js"
import 'react-h5-audio-player/lib/styles.css'
import { ArrowLeft, ArrowRight } from "lucide-react";



export default function Dashboard() {
    const router = useRouter();
    const [musicRecommendations, setMusicRecommendations] = useState([]);
    const [playlist, setPlaylist] = useState([]); // State for playlists
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [accessToken, setAccessToken] = useState("");

    const [songName, setSongName] = useState("");
    const [artistName, setArtistName] = useState("");

    const [searchQuery, setSearchQuery] = useState("")
    const [m3u8Url, setM3u8Url] = useState(""); 
    const [isLoading, setIsLoading] = useState(false); 
    const [showPlayer, setShowPlayer] = useState(false);
    const [isPlayerVisible, setIsPlayerVisible] = useState(false)
    const [songData, setSongData] = useState(null)
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const hlsRef = useRef<Hls | null>(null);
    const socketRef = useRef<WebSocket | null>(null)
    const [isHlsReady, setIsHlsReady] = useState(false);

    const verifyToken = async (token) => {
        try{
          const response = await fetch("http://127.0.0.1:8000/model/verify/token", {
            method : "POST", 
            headers : {
              "Content-Type" : "application/json"
            }, 
            body : JSON.stringify({access_token:token})
          })
    
          const data = await response.json()
    
          if(response.ok && data.auth){
            localStorage.setItem("user", JSON.stringify(data.user))
            setAccessToken(token);
            fetchMusicRecommendations();
            fetchPlaylists(); 
          } else {
            router.push("/login")
          }
        } catch {
    
        }
      } 

    useEffect(() => {
        const token = Cookies.get("access_token");
        verifyToken(token)
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

    const Loader = () => (
        <motion.div
          className="flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-12 h-12 border-4 border-t-transparent border-indigo-500 border-solid rounded-full animate-spin"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.5)',
              borderTopColor: 'rgba(255, 255, 255, 0.8)',
            }}
          />
        </motion.div>
      );

    const handleSearch = async () => {
        setSearchQuery(`${songName} ${artistName}`)
        if (!searchQuery) return; 
    
        setIsLoading(true)
    
        socketRef.current = new WebSocket("ws://127.0.0.1:8000/ws")
    
        socketRef.current.onopen = () => {
          console.log("Webscoket connection established")
          socketRef.current?.send(searchQuery)
        }
    
        socketRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data)
          console.log(data)
    
          if(data.artist && data.song){
            setSongData({
              name: data.song,
              artist: data.artist
            })
            setShowPlayer(true)
          }
    
          if(data.hls){
            setM3u8Url(data.file)
          }
    
          if(!data.hls){
            console.log("HLS stream not ready")
          }
        }
          
        socketRef.current.onerror = () => {
          console.error("Websocket error:", error)
        }
    
        socketRef.current.onclose = () => {
          console.log("WebSocket connection closed")
          setIsLoading(false)
        }
        }
    
    useEffect(() => {
        if (m3u8Url && Hls.isSupported() && audioRef.current) {
              
            const hls = new Hls();
            hlsRef.current = hls; 
              
            const desiredUrl = `http://127.0.0.1:8000/static/${m3u8Url}`;
            console.log("Loading HLS stream from:", desiredUrl);
        
              
            hls.loadSource(desiredUrl);
            hls.attachMedia(audioRef.current);
        
              
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log("HLS manifest parsed, ready to play.");
                setIsHlsReady(true)
            });
        
              // Error handling
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error("HLS.js error:", data);
                if (data.fatal) {
                  switch (data.fatal) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      console.error("Network error while fetching .ts files.");
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      console.error("Error loading media.");
                      break;
                    case Hls.ErrorTypes.OTHER_ERROR:
                      console.error("Other HLS.js error.");
                      break;
                    default:
                      break;
                  }
                }
            });
        
            return () => {
                hls.destroy(); // Cleanup HLS.js when the component is unmounted
            };
        } else if (audioRef.current) {
              // Fallback for browsers that support m3u8 natively
              audioRef.current.src = m3u8Url;
              setIsHlsReady(true)
        }
    }, [m3u8Url]);
          
    const skip = (seconds: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime += seconds;
        }
      };
    
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          setDuration(audioRef.current.duration || 0);
        }
      };
    
      const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
      };
    
      const togglePlayPause = () => {
        if (!audioRef.current) return;
    
        if (audioRef.current.paused) {
          audioRef.current.play();
          setIsPlaying(true);
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      };
    
      const handleSeek = (e: React.MouseEvent) => {
        if (!audioRef.current) return;
        const progressBar = e.currentTarget;
        const newTime = ((e.nativeEvent.offsetX / progressBar.offsetWidth) * duration);
        audioRef.current.currentTime = newTime;
      };
    
      const handlePlayClick = () => {
        setIsPlayerVisible(true)
      }


    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 text-white p-6">
            <ToastContainer />
            
            {/* Search Bar */}

            <div className="flex justify-center items-center mb-8">
            <input 
                type="text" 
                placeholder="Song name" 
                value={songName}
                onChange={(e) => setSongName(e.target.value)}
                className="flex-grow p-4 bg-white/10 border border-white/20 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 mr-2 max-w-md" // Increased width with max-w-md
            />
            <input 
                type="text" 
                placeholder="Artist name" 
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="flex-grow p-4 bg-white/10 border border-white/20 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-md" // Increased width with max-w-md
            />
            <button 
                onClick={handleSearch}
                className="ml-2 p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:scale-105 transition-all"
            >
                <Search className="h-5 w-5" />
            </button>
            </div>
            
            {/* Music Player */}
            <div className="flex justify-center items-center">
            {showPlayer && songData && (     
                <div className="mt-8 w-full max-w-5xl p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="text-2xl font-bold">{songData.name}</h3>
            <p className="text-gray-400">{songData.artist}</p>

            <div className="mt-4 flex flex-col items-center">
              <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                className="hidden"
              />

              {/* Custom Controls */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => skip(-5)}
                  className="text-white p-2 rounded-md hover:bg-gray-600"
                >
                  <ArrowLeft className="w-5 h-5"/>
                </button>

                {/* Play Button with Loading Text */}
                <button
                  onClick={togglePlayPause}
                  className="text-white bg-indigo-500 px-6 py-2 rounded-full hover:scale-105 transition-transform"
                  disabled={!isHlsReady} // Disable until HLS is ready
                >
                  {isHlsReady ? (isPlaying ? "Pause" : "Play") : "Loading..."} {/* Show "Loading..." until HLS is ready */}
                </button>

                <button
                  onClick={() => skip(5)}
                  className="text-white p-2 rounded-md hover:bg-gray-600"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div
                className="mt-4 w-full bg-gray-700 rounded-full h-2 relative"
                onClick={handleSeek}
              >
                <div
                  style={{
                    width: `${(currentTime / duration) * 100 || 0}%`,
                  }}
                  className="bg-indigo-500 h-2 rounded-full"
                ></div>
              </div>

              {/* Time Labels */}
              <div className="mt-2 flex justify-between w-full text-sm text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
                </div>
            )}

            {isLoading && !songData && <Loader />}
            </div>

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
