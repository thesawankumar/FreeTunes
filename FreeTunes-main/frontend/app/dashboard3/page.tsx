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
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import Hls from "hls.js";
import 'react-h5-audio-player/lib/styles.css';
import { FaPlay, FaPause, FaArrowLeft, FaArrowRight, FaHeart, FaPlus } from 'react-icons/fa';
import { MdMusicNote } from 'react-icons/md';

const Dashboard = () => {
  const router = useRouter();
  const [musicRecommendations, setMusicRecommendations] = useState([]);
  const [playlist, setPlaylist] = useState([]); // State for playlists
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [accessToken, setAccessToken] = useState("");

  const [songName, setSongName] = useState("");
  const [artistName, setArtistName] = useState("");
  const [songData, setSongData] = useState(null)
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

  const verifyToken = async (token) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/model/verify/token", {
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

  const handleSearch = async () => {
    setSearchQuery(`${songName} ${artistName}`);
    if (!searchQuery) return;

    setIsLoading(true);

    socketRef.current = new WebSocket("ws://127.0.0.1:8000/ws");

    socketRef.current.onopen = () => {
      console.log("WebSocket connection established");
      socketRef.current?.send(searchQuery);
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);

      if (data.artist && data.song) {
        setSongData({
            name: data.song,
            artist: data.artist
          });
        setShowPlayer(true); // Ensure player is shown when valid song data is received
      }
      if (data.hls) {
        setM3u8Url(data.file);
      }
    };

    socketRef.current.onerror = () => {
      console.error("WebSocket error");
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed");
      setIsLoading(false);
    };
  };

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
        setIsHlsReady(true);
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
      setIsHlsReady(true);
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
    setIsPlayerVisible(true);
  };

  return (
    <div className="min-h-screen flex bg-gray-950 text-white">
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

        {/* Audio Player */}

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
      <div className="flex items-center space-x-6">
        <button onClick={() => skip(-10)} className="text-white hover:text-gray-400 transition duration-200">
          <ArrowLeft className="h-8 w-8" />
        </button>
        <button onClick={togglePlayPause} className="text-white hover:text-gray-400 transition duration-200">
          {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
        </button>
        <button onClick={() => skip(10)} className="text-white hover:text-gray-400 transition duration-200">
          <ArrowRight className="h-8 w-8" />
        </button>
      </div>

      {/* Right-aligned Like and Add to Playlist Buttons */}
      <div className="flex items-center space-x-4">
        <button className="text-white hover:text-gray-400 transition duration-200">
          <FaHeart className="h-7 w-7" />
        </button>
        <button className="text-white hover:text-gray-400 transition duration-200">
          <FaPlus className="h-7 w-7" />
        </button>
      </div>
    </div>

    {/* Progress Bar */}
    <div className="relative mt-4">
      <input
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={handleSeek}
        className="w-full h-2 bg-gradient-to-r from-blue-700 to-violet-700 appearance-none rounded-full"
      />
      <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-gray-400 mt-6">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  </div>
)   }

{/* Custom styles for the range input */}<style jsx>{`
  input[type="range"]::-webkit-slider-thumb {
    width: 24px; /* Flat thumb */
    height: 6px; /* Thin thumb */
    background-color: #fff; /* White thumb */
    border-radius: 50px; /* Rounded pill shape */
    border: none; /* No border */
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 24px;
    height: 6px;
    background-color: #fff;
    border-radius: 50px;
    border: none;
    cursor: pointer;
  }

  input[type="range"]::-ms-thumb {
    width: 24px;
    height: 6px;
    background-color: #fff;
    border-radius: 50px;
    border: none;
    cursor: pointer;
  }
`}</style>



            


      </main>
    </div>
  );
};

export default Dashboard;
