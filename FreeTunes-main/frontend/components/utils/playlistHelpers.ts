import { toast } from 'react-toastify'
import Cookies from 'js-cookie';

export const handlePlaylistClick = (
  selectedPlaylists: string [],
  playlist: string,
  setSelectedPlaylists: React.Dispatch<React.SetStateAction<string[]>>
) => {
  if (selectedPlaylists.includes(playlist)) {
    setSelectedPlaylists(selectedPlaylists.filter(p=>p !=playlist)); 
  } else {
    setSelectedPlaylists([...selectedPlaylists, playlist]); 
  }
};


export const handleSubmit = async (
  selectedPlaylists: string[],
  onClose: () => void,
  songName: string,
  artistName: string
) => {
  if (selectedPlaylists.length === 0) {
    toast.error("Please select or create a playlist first.");
    return;
  }

  const token = Cookies.get("access_token");
  const user = JSON.parse(localStorage.getItem("user"))
  const userID = user?.id
  try {
    for (const playlistName of selectedPlaylists) {
      const idResponse = await fetch(`http://127.0.0.1:7823/model/playlist/id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": token,
        },
        body: JSON.stringify({
          playlistName : playlistName,
          userID : userID,
        }),
      });

      if (!idResponse.ok) {
        const errorData = await idResponse.json()
        console.error(`Failed to fetch playlist ID for '${playlistName}':`, errorData.detail);
        throw new Error(errorData.detail || "Failed to fetch playlist ID")
      }

      const playlistId = await idResponse.json()

      const songInfo = {
        songName: songName,
        artistName: artistName,
      }


      const requestBody = {
        action: "add", 
        song: songInfo,
        name: playlistName,
        userID: user.id,
        liked: false,
      }

      const updateResponse = await fetch(`http://127.0.0.1:7823/model/update/playlist/${playlistId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "authorization": token,
        },
        body: JSON.stringify(requestBody),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error(`Failed to update playlist (ID: ${playlistId}):`, errorData.detail);
        throw new Error(errorData.detail || "Failed to update playlist");
      }
    }
    toast.success("Song added to selected playlists successfully!");
    onClose();
  } catch (error) {
    console.error("Error updating playlists:", error);
    toast.error("Failed to update playlists.");
  }
};
