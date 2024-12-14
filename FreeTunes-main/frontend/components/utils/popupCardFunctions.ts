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


export const handlePlaylistSelect = (selectedPlaylist: string | null, onPlaylistSelect: Function) => {
  if (selectedPlaylist) {
    onPlaylistSelect(selectedPlaylist);
  }
};


export const handlePopupClose = (setIsPopupVisible: React.Dispatch<React.SetStateAction<boolean>>) => {
  setIsPopupVisible(false);
};


export const handleCreatePlaylist = async (newPlaylistName: string, createPlaylist: Function, setNewPlaylistName: React.Dispatch<React.SetStateAction<string>>, setShowCreateInput: React.Dispatch<React.SetStateAction<boolean>>) => {
  if (newPlaylistName.trim()) {
    await createPlaylist(newPlaylistName);
    setNewPlaylistName("");
    setShowCreateInput(false);
  } else {
    toast.error("Playlist name cannot be empty");
  }
};


// update backend -> create/playlist
export const createPlaylist = async (newPlaylistName: string, token: string, songName: string, artistName: string) => {
  try {
    const response = await fetch('http://127.0.0.1:7823/create/playlist',{
      method : "POST", 
      headers: {
        "Content-Type" : "application/json",
        "authorization" : "token",
      },
      body: JSON.stringify({name: newPlaylistName})   //update the body to include song and artist name
    })

    if (response.ok){
      const data = await response.json()
      toast.success(`Playlist '${data.name}' created successfully!`)
      return data.name
    } else {
      throw new Error('Failed to create playlist')
    } 
  } catch(error) {
    console.error("Error creating playlist", error)
    toast.error("Failed to create playlist. Please try again")
  }
}

