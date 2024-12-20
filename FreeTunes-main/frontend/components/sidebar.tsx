import { ChevronFirst, ChevronLast, Music } from "lucide-react";
import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  expanded: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProps {
  children: ReactNode;
  className?: string; // Add className prop here
}

export default function Sidebar({ children, className }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside className={`h-screen ${className}`}>
      <nav className="h-full flex flex-col bg-gradient-to-b from-gray-950/80 to-gray-800/80 text-white border-r shadow-xl transition-all duration-300 ease-in-out backdrop-blur-md">
        {/* Header (Collapse button) */}
        <div className="p-4 flex justify-between items-center">
          <h1
            className={`font-bold text-lg transition-all duration-300 ${
              expanded ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            Playlists
          </h1>
          <button
            onClick={() => setExpanded((curr) => !curr)}
            className="p-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-700 hover:to-purple-600 text-white shadow-lg transform transition-all duration-300 ease-in-out"
            aria-label="Toggle Sidebar"
          >
            {expanded ? (
              <ChevronFirst className="h-6 w-6 transform transition-all duration-300" />
            ) : (
              <ChevronLast className="h-6 w-6 transform transition-all duration-300" />
            )}
          </button>
        </div>

        <SidebarContext.Provider value={{ expanded }}>
          <ul className="flex-1 px-3 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {children}
          </ul>
        </SidebarContext.Provider>
      </nav>
    </aside>
  );
}



export function SidebarItem({ playlist, active, onSelect }) {
  const context = useContext(SidebarContext);

  // Type guard to ensure context is not undefined
  if (!context) {
    throw new Error("SidebarContext must be used within a Sidebar");
  }

  const { expanded } = context;

  return (
    <li
      onClick={() => onSelect(playlist)}
      className={`flex items-center py-3 px-4 rounded-lg cursor-pointer transition-all duration-300 ease-in-out group ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-purple-500 shadow-lg text-white"
          : "bg-gray-700/50 text-gray-400 hover:bg-gray-700/80 hover:text-white"
      }`}
    >
      {/* Playlist Icon */}
      <div className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded-full overflow-hidden shadow-md">
        <Music
          className={`h-6 w-6 ${
            active ? "text-white" : "text-gray-400 group-hover:text-white"
          }`}
        />
      </div>

      {/* Playlist Details */}
      <div
        className={`ml-4 transition-all duration-300 ${
          expanded ? "opacity-100" : "opacity-0 hidden"
        }`}
      >
        <h2 className="font-semibold text-base">{playlist.name}</h2>
        <p className="text-sm text-gray-400">{playlist.songCount} songs</p>
      </div>
    </li>
  );
}

