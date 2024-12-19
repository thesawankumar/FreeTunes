import { ChevronFirst, ChevronLast } from "lucide-react";
import { createContext, useContext, useState } from "react";

// Sidebar Context
const SidebarContext = createContext();

export default function Sidebar({ children }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <aside className="h-screen">
      <nav className="h-full flex flex-col bg-gradient-to-b from-gray-950 to-gray-800 text-white border-r shadow-md transition-all duration-300 ease-in-out">
        {/* Header (Collapse button) */}
        <div className="p-4 flex justify-between items-center">
          <button
            onClick={() => setExpanded((curr) => !curr)}
            className="p-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-700 hover:to-purple-600 text-white shadow-lg transform transition-all duration-300 ease-in-out"
          >
            {expanded ? (
              <ChevronFirst className="h-6 w-6 transform transition-all duration-300" />
            ) : (
              <ChevronLast className="h-6 w-6 transform transition-all duration-300" />
            )}
          </button>
        </div>

        <SidebarContext.Provider value={{ expanded }}>
          <ul className="flex-1 px-3">
            {children}
          </ul>
        </SidebarContext.Provider>
      </nav>
    </aside>
  );
}

export function SidebarItem({ playlist, active, onSelect }) {
  const { expanded } = useContext(SidebarContext);

  return (
    <li
      onClick={() => onSelect(playlist)} // Handle playlist selection
      className={`flex items-center py-2 px-4 my-2 font-medium rounded-md cursor-pointer transition-all duration-200 ease-in-out ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-purple-500 text-white"
          : "text-gray-400 hover:bg-gray-700 hover:text-white"
      }`}
    >
      {/* Playlist Initials or Name */}
      <div className="flex items-center">
        {/* Display initials or full name based on `expanded` state */}
        <span
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            expanded ? "w-auto ml-3" : "w-12 text-center"
          }`}
        >
          {expanded ? playlist.name : playlist.name[0]} {/* Show full name or initials */}
        </span>
      </div>
    </li>
  );
}
