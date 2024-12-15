"use client";
import { ArrowLeft, ArrowRight, Music, Play, Pause, Search } from "lucide-react";
import { motion } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactAudioPlayer from 'react-h5-audio-player';
import { FaPlay, FaPause, FaArrowLeft, FaArrowRight, FaHeart, FaPlus } from 'react-icons/fa';
import { MdMusicNote } from 'react-icons/md';
import Hls from "hls.js";
import PlusPopup from "@/components/popupCard";
import { fetchPlaylistNames } from "@/components/utils/popupCardFunctions";

const Dashboard = () => {
  const router = useRouter();
  const [musicRecommendations, setMusicRecommendations] = useState([]);
  const [playlist, setPlaylist] = useState([]); // State for playlists
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [songData, setSongData] = useState({ name: "", artist: "" });

  const [searchQuery, setSearchQuery] = useState("");
  const [m3u8Url, setM3u8Url] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const hlsRef = useRef<Hls | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [isHlsReady, setIsHlsReady] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isUrlavailable, setIsUrlavailable] = useState(false)

  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [playlistNames, setPlaylistNames] = useState<string[] | null>(null);

  
  const handlePlus = async () => {
    setIsPopupVisible(true);
    const token = Cookies.get("access_token");
    if (token) {
      const { selectedPlaylists, unselectedPlaylists } = await fetchPlaylistNames(token, songData.name, songData.artist);
      const combinedPlaylists = [...selectedPlaylists, ...unselectedPlaylists];
      setPlaylistNames(combinedPlaylists);
    }
  };

  const handlePopupClose = () => {
    setIsPopupVisible(false);
  };

  const handlePlaylistSelect = (playlistName: string) => {
    console.log(`Selected Playlist: ${playlistName}`);
  };

  const createPlaylist = async (playlistName: string, songName: string, artistName: string) => {
    console.log(`Create Playlist: ${playlistName}`);
    const token = Cookies.get("access_token");
    console.log(token)
    const user = JSON.parse(localStorage.getItem("user"));
  
    try {
      const response = await fetch('http://127.0.0.1:7823/model/create/playlist', {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          "authorization": token,
        },
        body: JSON.stringify({
          name: playlistName, 
          userID: user?.id,  
          songs: [{
            songName: songName,
            artistName: artistName
          }],
          liked: false
        }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log("Playlist created successfully", data);

        const { selectedPlaylists, unselectedPlaylists } = await fetchPlaylistNames(token, songData.name, songData.artist);
        const combinedPlaylists = [...selectedPlaylists, ...unselectedPlaylists];
        setPlaylistNames(combinedPlaylists);
        console.log(combinedPlaylists)
        return data;

      } else {
        const errorData = await response.json();
        console.error("Failed to create playlist", errorData);
        throw new Error(errorData.message || "Failed to create playlist");
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("Failed to create playlist.");
    }
  };
  


  const verifyToken = async (token) => {
    try {
      const response = await fetch("http://127.0.0.1:7823/model/verify/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ access_token: token })
      });

      const data = await response.json();

      if (response.ok && data.auth) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setAccessToken(token);
        fetchMusicRecommendations();
        fetchPlaylists();
      } else {
        router.push("/login");
      }
    } catch {
      // Handle error
    }
  };

  useEffect(() => {
    const token = Cookies.get("access_token");
    verifyToken(token);
  }, []);

  const fetchMusicRecommendations = async () => {
    try {
      const response = await fetch("http://127.0.0.1:7823/model/recommendations", {
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
        //toast.error("Failed to fetch music recommendations.");
      }
    } catch (error) {
      //toast.error("Error fetching recommendations.");
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("http://127.0.0.1:7823/model/playlists", { // Adjust endpoint as necessary
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
        //toast.error("Failed to fetch playlists.");
      }
    } catch (error) {
      //toast.error("Error fetching playlists.");
    }
  };

  const handleSearch = async () => {
    setSongData({ song: songName, artist: artistName });
    resetPlayer();
    console.log(songName);
    
    
    setSearchQuery(`${songName} ${artistName} song`);
    setIsLoading(true);
  };

  useEffect(() => {
    if (searchQuery) {
      console.log(searchQuery)
        const authToken = Cookies.get('access_token')
        socketRef.current = new WebSocket("ws://127.0.0.1:7823/ws");


        socketRef.current.onopen = () => {
            console.log("WebSocket connection established");
            socketRef.current?.send(JSON.stringify({ type: 'auth', token: authToken }));
            socketRef.current?.send(searchQuery);  
        };

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data);
            

            if (data.artist && data.song) {
                setSongData({
                    name: data.song,
                    artist: data.artist,
                });
                setShowPlayer(true);
            }
            
            if(data.liked){
              setIsLiked(true)
            } else {
              setIsLiked(false)
            }


            if (data.hls !== undefined) {
                if (data.hls) {
                    console.log("HLS stream ready");
                    console.log(isLiked)
                    setM3u8Url(data.file);
                    setIsUrlavailable(true);
                } else {
                    setIsLoading(true)
                    console.log("HLS stream not ready");
                    setM3u8Url("");
                    setIsUrlavailable(false);
                }
            }
        };

        socketRef.current.onerror = () => {
            console.error("Websocket error:", error);
        };

        socketRef.current.onclose = () => {
            console.log("WebSocket connection closed");
            setIsLoading(false);
        };

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }
  }, [searchQuery]); 


  useEffect(() => {
      if (isUrlavailable && m3u8Url && Hls.isSupported() && audioRef.current) {
          
          const hls = new Hls();
          hlsRef.current = hls; 
          
          const desiredUrl = `http://127.0.0.1:7823/static/${m3u8Url}`;
          console.log("Loading HLS stream from:", desiredUrl);
      
            
          hls.loadSource(desiredUrl);
          hls.attachMedia(audioRef.current);
      
            
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log("HLS manifest parsed, ready to play.");
              setIsHlsReady(true)
              setIsLoading(false)
          });
      
          
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
              hls.destroy();
              hlsRef.current = null 
          };
      } else if (audioRef.current) {
            
            audioRef.current.src = m3u8Url;
            setIsHlsReady(true)
            setIsLoading(false)
      }
  }, [isUrlavailable, m3u8Url]);
      

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


  const handleSeek = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!audioRef.current || duration === 0) return;
  
    const progressBar = e.currentTarget; 
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left; 
    const newTime = (clickPosition / progressBar.offsetWidth) * duration;
  
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePlayClick = () => {
    setIsPlayerVisible(true);
  };

  const resetPlayer = () => {
    setIsLoading(true)
    console.log('Resetting player...');
    if (audioRef.current) {
        audioRef.current.pause();
        console.log('Audio paused.');
        audioRef.current.src = '';
        audioRef.current.load();
        audioRef.current.currentTime = 0;
        console.log('Audio element reset.');
    }

    if (hlsRef.current) {
        hlsRef.current.destroy();
        console.log('HLS instance destroyed.');
        hlsRef.current = null;
    }

    if (socketRef.current) {
        socketRef.current.close();
        console.log('WebSocket connection closed.');
        socketRef.current = null;
    }

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setM3u8Url('');
    setIsHlsReady(false);
    // setSongData(null);
    setIsUrlavailable(false);
    console.log('State reset complete.');
  };

  
  const handleLike = async () => {
    const previousLikedState = isLiked; 
    setIsLiked(!isLiked);
    const token = Cookies.get("access_token"); 
    const user = JSON.parse(localStorage.getItem("user")); 
    const playlistId = user?.playlist[0]; 
  
    if (!playlistId) {
      toast.error("Playlist not found. Please try again.");
      setIsLiked(previousLikedState);
      return;
    }
  
    const songInfo = {
      songName: songData.name,
      artistName: songData.artist,
    };
  
    const requestBody = {
      action: !isLiked ? "add" : "remove", 
      song: songInfo,
      name: "Liked",
      userID: user.id,
      liked: true,
    };
  
    try {
      const response = await fetch(`http://127.0.0.1:7823/model/update/playlist/${playlistId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token, 
        },
        body: JSON.stringify(requestBody),
      });
  
      if (response.ok) {
        const result = await response.json();
        if (!isLiked) {
          toast.success("Added to Liked Songs!");
        } else {
          toast.success("Removed from Liked Songs!");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update the playlist");
      }
    } catch (error) {
      console.error("Error in handleLike:", error.message);
      toast.error("Failed to like the song");
      setIsLiked(previousLikedState); 
    }
  };
  

  return (
    <div className="min-h-screen flex bg-gray-950 text-white">
      <ToastContainer />
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-br from-indigo-700 via-purple-800 to-purple-900 text-white p-6">
        <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-300">
          FreeTunes
        </h1>
        <nav>
          <ul className="space-y-4">
            {["Home", "Playlists", "Favorites", "Settings"].map((item, idx) => (
              <motion.li
                key={idx}
                whileHover={{ scale: 1.05, x: 5 }}
                className="hover:bg-purple-600 hover:bg-opacity-30 p-3 rounded-lg transition-all cursor-pointer"
              >
                <a href="#">{item}</a>
              </motion.li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h2 className="text-4xl font-extrabold text-gray-100 mb-6">
          Welcome Back!
        </h2>      

        {/* Search Bar */}
        <div className="flex items-center space-x-4 mb-6">
          <input
            type="text"
            placeholder="Song name"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            className="flex-grow p-4 bg-white/10 border border-white/20 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Artist name"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="flex-grow p-4 bg-white/10 border border-white/20 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleSearch}
            className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:scale-105 transition-all"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Recently Played */}
       <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-200 mb-4">
            Recently Played
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.03 }}
                className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 shadow-lg rounded-xl p-4 flex items-center gap-4 transition-all"
              >
                <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Music className="text-gray-300 w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white">Song Title</h4>
                  <p className="text-gray-400 text-sm">Artist Name</p>
                </div>
                <button
                  className="text-indigo-400 hover:text-indigo-600 transition-all"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause /> : <Play />}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Playlists */}
        <section>
          <h3 className="text-2xl font-semibold text-gray-200 mb-4">
            Your Playlists
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 shadow-lg rounded-xl p-6 flex flex-col items-center transition-all"
              >
                <div className="w-32 h-32 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                  <Music className="text-gray-300 w-12 h-12" />
                </div>
                <h4 className="font-bold text-white">Playlist Name</h4>
                <p className="text-gray-400 text-sm">10 Songs</p>
              </motion.div>
            ))}
          </div>
        </section>

        {showPlayer && songData && (
          <div className="bg-black p-6 fixed bottom-0 left-0 w-full z-10">
            <div className="flex justify-between items-center">
              {/* Song Details and Music Icon */}
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-700 flex items-center justify-center">
                  <Music className="text-white w-6 h-6" />
                </div>
                <div className="ml-4 text-white">
                  <h4 className="font-semibold text-lg">{songData.name}</h4>
                  <p className="text-gray-400 text-sm">{songData.artist}</p>
                </div>
              </div>

              {/* Centered Buttons Section */}
              <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                src={m3u8Url}  // Ensure you are setting the source if needed
                className="hidden" // Keep hidden unless you want to show native controls
                preload="auto"
              />

              <div className="flex items-center space-x-6">
                <button onClick={() => skip(-10)} className="text-white hover:text-gray-400 transition duration-200">
                  <ArrowLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="text-white hover:text-gray-400 transition duration-200"
                  disabled={!isHlsReady || isLoading}
                >
                  {isLoading ? (
                    <div className="w-8 h-8 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
                  ) : isHlsReady ? (
                    isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8" />
                    )
                  ) : null }
                </button>
                <button onClick={() => skip(10)} className="text-white hover:text-gray-400 transition duration-200">
                  <ArrowRight className="h-8 w-8" />
                </button>
              </div>

              {/* Right Section with Liked Button */}
              <div className="flex items-center space-x-6">
                <button className="text-white" onClick={handleLike}>
                  <FaHeart
                    className={`h-6 w-6 ${isLiked ? "text-purple-600" : "text-gray-400"}`} // Apply the color conditionally
                  />
                </button>
                  
                <button onClick={handlePlus} className="text-white">
                  <FaPlus className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full bg-gray-700 rounded-full">
            <div
              onClick={handleSeek}
              className="relative w-full h-2 bg-gray-700 rounded-full cursor-pointer"
            >
              <div
                className="absolute top-0 left-0 h-2 bg-indigo-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
              {/* <div
                onClick={handleSeek}
                className="h-2 bg-indigo-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              /> */}
            </div>
            <div className="flex justify-between text-sm mt-2 text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {isPopupVisible && (
          <PlusPopup 
            onClose={handlePopupClose}
            playlistNames={playlistNames}
            onPlaylistSelect={handlePlaylistSelect}
            createPlaylist={createPlaylist}
            songName={songData.name}  // Pass songName here
            artistName={songData.artist}
          />
        )}
        
      </main>
    </div>
  );
};

export default Dashboard;
