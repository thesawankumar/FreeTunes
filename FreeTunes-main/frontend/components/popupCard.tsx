import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

interface PlusPopupProps {
  handlePlus: () => void;
  onClose: () => void;
}

const PlusPopup: React.FC<PlusPopupProps> = ({ handlePlus, onClose }) => {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    // Handle the submission of the content here
    console.log("Content Submitted:", content);
    handlePlus(); // Run the handlePlus function passed from the parent
    onClose(); // Close the popup
  };

  return (
    <motion.div
      className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white w-96 p-6 rounded-xl shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
        >
          <FaTimes className="h-6 w-6" />
        </button>
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Add New Item</h3>
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter some details..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-all"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlusPopup;
