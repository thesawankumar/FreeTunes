import { toast } from 'react-toastify'
import Cookies from 'js-cookie';

export const handlePlaylistClick = (
  selectedPlaylists: string [],
  playlist: string,
  setSelectedPlaylists: React.Dispatch<React.SetStateAction<string[]>>,
  setUnselectedPlaylists: React.Dispatch<React.SetStateAction<string[]>>
) => {
  if (selectedPlaylists.includes(playlist)) {
    setSelectedPlaylists((prevSelected) => prevSelected.filter((p) => p !== playlist));
    setUnselectedPlaylists((prevUnselected) => [...prevUnselected, playlist])
  } else {
    setSelectedPlaylists((prevSelected) => [...prevSelected, playlist]);
    setUnselectedPlaylists((prevUnselected) =>
      prevUnselected.filter((p) => p !== playlist)
    );
  }
};

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;

export const handleSubmit = async (
  unselectedPlaylists: string[],
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
      const idResponse = await fetch(`${serverURL}/model/playlist/id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "authorization": token } : {}),
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

      const updateResponse = await fetch(`${serverURL}/model/update/playlist/popup/${playlistId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "authorization": token } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error(`Failed to update playlist (ID: ${playlistId}):`, errorData.detail);
        throw new Error(errorData.detail || "Failed to update playlist");
      }
    }

    for (const playlistName of unselectedPlaylists){
      const idResponse = await fetch(`${serverURL}/model/playlist/id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "authorization": token } : {}),
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

      const playlistResponse = await fetch(`${serverURL}/model/playlist/${playlistId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "authorization": token } : {}),
        },
      });

      if (!playlistResponse.ok) {
        const errorData = await playlistResponse.json();
        console.error(`Failed to fetch playlist (ID: ${playlistId}):`, errorData.detail);
        throw new Error(errorData.detail || "Failed to fetch playlist");
      }

      const playlistData = await playlistResponse.json()

      const songExists = playlistData.songs.some(
        (song: { songName: string; artistName: string }) =>
          song.songName === songName && song.artistName === artistName
      );

      const songInfo = {
        songName: songName,
        artistName: artistName,
      }

      const requestBody = {
        action: "remove", 
        song: songInfo,
        name: playlistName,
        userID: user.id,
        liked: false,
      }

      if (songExists) {
        const updateResponse = await fetch(`${serverURL}/model/update/playlist/popup/${playlistId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "authorization": token } : {}),
          },
          body: JSON.stringify(requestBody),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          console.error(`Failed to update playlist (ID: ${playlistId}):`, errorData.detail);
          throw new Error(errorData.detail || "Failed to update playlist");
        }
      }
    }

    toast.success("Song added to selected playlists successfully!");
    onClose();
  } catch (error) {
    console.error("Error updating playlists:", error);
    toast.error("Failed to update playlists.");
  }
};
