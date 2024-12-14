import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaCheckCircle } from "react-icons/fa";
import { handlePlaylistClick, handleCreatePlaylist, handleSubmit } from "./utils/playlistHelpers";

interface PlusPopupProps {
  onClose: () => void;
  playlistNames: string[] | null;
  onPlaylistSelect: (playlistName: string) => void;
  createPlaylist: (playlistName: string) => void;
}

const PlusPopup: React.FC<PlusPopupProps> = ({ 
  onClose, 
  playlistNames, 
  onPlaylistSelect, 
  createPlaylist 
}) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState(""); 
  const [showCreateInput, setShowCreateInput] = useState(false); 

  return (
    <motion.div
      className="fixed inset-0 bg-gray-900 bg-opacity-80 flex justify-center items-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-black w-96 p-8 rounded-3xl shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-200 hover:text-white transition-transform transform hover:scale-110"
        >
          <FaTimes className="h-5 w-5" />
        </button>
        <h3 className="text-3xl font-extrabold text-white mb-6 tracking-tight">Add to Playlist</h3>

        {/* Loader while playlistNames is loading */}
        {!playlistNames ? (
          <div className="flex justify-center items-center space-x-3">
            <div className="w-10 h-10 border-4 border-t-transparent border-indigo-600 rounded-full animate-spin"></div>
            <span className="text-white text-lg">Loading playlists...</span>
          </div>
        ) : (
          <div className="space-y-5">
            {playlistNames?.map((playlist, idx) => (
              <div
                key={idx}
                onClick={() => handlePlaylistClick(selectedPlaylist, playlist, setSelectedPlaylist)} // Use the imported function
                className={`flex items-center space-x-4 cursor-pointer p-4 rounded-2xl transition-transform transform hover:bg-indigo-700 hover:scale-105 ${
                  selectedPlaylist === playlist ? "bg-indigo-600 shadow-lg scale-105" : "bg-transparent"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full border-2 border-indigo-500 flex items-center justify-center transition-transform ${
                    selectedPlaylist === playlist ? "bg-indigo-500" : "bg-transparent"
                  }`}
                >
                  {selectedPlaylist === playlist && <FaCheckCircle className="text-white w-4 h-4" />}
                </div>
                <span className="text-white text-lg font-semibold">{playlist}</span>
              </div>
            ))}
          </div>
        )}

        {/* Button to show the input field for creating a new playlist */}
        {!showCreateInput && (
          <button
            onClick={() => setShowCreateInput(true)}
            className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-700 text-white px-6 py-2 rounded-2xl hover:bg-gradient-to-l transition-all ease-out duration-300 transform hover:scale-105"
          >
            Create New Playlist
          </button>
        )}

        {/* Input field for creating a new playlist */}
        {showCreateInput && (
          <div className="mt-6">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="New Playlist Name"
              className="w-full p-4 rounded-xl bg-black text-white placeholder-gray-400 focus:outline-none border-2 border-indigo-500 shadow-lg transform transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl"
            />
            <button
              onClick={() => handleCreatePlaylist(newPlaylistName, createPlaylist, setNewPlaylistName, setShowCreateInput)} // Use the imported function
              className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-700 text-white px-6 py-2 rounded-2xl hover:bg-gradient-to-l transition-all ease-out duration-300 transform hover:scale-105"
            >
              Create Playlist
            </button>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => handleSubmit(selectedPlaylist, "", onClose, onPlaylistSelect)} // Submit without content for now
            className="bg-gradient-to-r from-indigo-500 to-purple-700 text-white px-8 py-3 rounded-2xl hover:bg-gradient-to-l transition-all ease-out duration-300 transform hover:scale-105"
          >
            Submit
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PlusPopup;
