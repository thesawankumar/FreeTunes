import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, Pause } from 'lucide-react';

const RecentlyPlayedSection = ({ history, isPlaying, handleSearch }) => {
  // State to store the last search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounced version of handleSearch to prevent unnecessary calls
  const handleDebouncedSearch = useCallback(
    (songName, artistName) => {
      // Only call handleSearch if the songName has changed
      if (songName !== debouncedSearchQuery) {
        setDebouncedSearchQuery(songName);
        handleSearch(songName, artistName); // Trigger search with the new query
      }
    },
    [debouncedSearchQuery, handleSearch] // Re-create the callback if debouncedSearchQuery or handleSearch changes
  );

  return (
    <section className="mb-12">
      <h3 className="text-2xl font-semibold text-gray-200 mb-4">Recently Played</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {history && history.length > 0 ? (
          history.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03 }}
              className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 shadow-lg rounded-xl p-4 flex items-center gap-4 transition-all"
            >
              <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                <Music className="text-gray-300 w-8 h-8" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white">{item.songName || 'Unknown Song'}</h4>
                <p className="text-gray-400 text-sm">{item.artistName || 'Unknown Artist'}</p>
              </div>
              <button
                className="text-indigo-400 hover:text-indigo-600 transition-all"
                onClick={() => handleDebouncedSearch(item.songName, item.artistName)} // Using debounced version
              >
                {isPlaying ? <Pause /> : <Play />} {/* Show Pause or Play depending on isPlaying */}
              </button>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-400">No recently played songs found.</p>
        )}
      </div>
    </section>
  );
};

export default RecentlyPlayedSection;
