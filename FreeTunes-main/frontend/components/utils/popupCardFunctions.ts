import { toast } from 'react-toastify';

export const fetchPlaylistNames = async (token: string) => {
  try {
    const response = await fetch('http://127.0.0.1:7823/model/playlist', {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "authorization": token,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data)
      return data.map((playlist: { name: string }) => playlist.name);
    } else {
      throw new Error("Failed to fetch playlists");
    }
  } catch (error) {
    console.error("Error fetching playlists:", error);
    toast.error("Failed to fetch playlists.");
    return [];
  }
};

export const handlePopupClose = (setIsPopupVisible: React.Dispatch<React.SetStateAction<boolean>>) => {
  setIsPopupVisible(false);
};

export const handleCreatePlaylist = async (songName: string, artistName: string,newPlaylistName: string, createPlaylist: Function, setNewPlaylistName: React.Dispatch<React.SetStateAction<string>>, setShowCreateInput: React.Dispatch<React.SetStateAction<boolean>>) => {
  if (newPlaylistName.trim()) {
    await createPlaylist(newPlaylistName, songName, artistName);
    setNewPlaylistName("");
    setShowCreateInput(false);
  } else {
    toast.error("Playlist name cannot be empty");
  }
};
