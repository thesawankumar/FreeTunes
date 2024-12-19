import { useState } from "react";
import { motion } from "framer-motion";

const SidebarLayout = (playlist) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to toggle sidebar

  // Toggle sidebar function
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Sidebar Toggle Button */}
      <button
        className="text-white absolute top-6 left-6 z-30"
        onClick={toggleSidebar}
      >
        {/* Hamburger Icon */}
        <div className="w-8 h-8 flex flex-col justify-between items-center">
          <div className="w-full h-1 bg-white"></div>
          <div className="w-full h-1 bg-white"></div>
          <div className="w-full h-1 bg-white"></div>
        </div>
      </button>

      {/* Sidebar */}
      <motion.aside
        className={`w-80 bg-gradient-to-br from-indigo-800 via-purple-800 to-purple-900 text-white p-6 rounded-lg shadow-lg fixed top-0 left-0 h-full z-20 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        <h1 className="text-4xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-300">
          FreeTunes
        </h1>

        {/* Playlists Section */}
        <section className="mt-6">
          <h3 className="text-2xl font-semibold text-gray-200 mb-4">Playlists</h3>
          <ul className="space-y-4">
            {playlist.map((pl, idx) => (
              <motion.li
                key={idx}
                whileHover={{
                  scale: 1.05,
                  rotate: 2,
                  transition: { type: "spring", stiffness: 300 },
                }}
                className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 hover:from-indigo-600 hover:to-purple-600 hover:shadow-xl rounded-xl p-4 cursor-pointer transition-all ease-in-out transform"
              >
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">{pl.name}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-indigo-300 hover:text-white transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 12l6 6 6-6"
                    />
                  </svg>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* Overlay for when sidebar is open */}
        <div
          className={`fixed top-0 left-0 w-full h-full bg-black opacity-50 z-10 ${
            isSidebarOpen ? "block" : "hidden"
          }`}
          onClick={toggleSidebar}
        ></div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 p-8 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-80" : "ml-0"}`}>
        {/* Your main content */}
        <h2>Welcome to FreeTunes</h2>
      </main>
    </div>
  );
};
