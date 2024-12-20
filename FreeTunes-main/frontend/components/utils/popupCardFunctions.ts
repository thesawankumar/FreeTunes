import { toast } from 'react-toastify';

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;

export const fetchPlaylistNames = async (token: string, songName: string, artistName: string) => {
  try {
    const response = await fetch(`${serverURL}/model/playlist`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "authorization": token } : {}),
      },
    });

    if (response.ok) {
      const data = await response.json();
      const selectedPlaylists = [];
      const unselectedPlaylists = [];

      for (const playlist of data) {
        const playlistName = playlist.name;
        const songExists = playlist.songs.some(
          (song: { songName: string; artistName: string }) =>
            song.songName === songName && song.artistName === artistName
        );

        if (songExists) {
          (selectedPlaylists as any).push(playlistName);
        } else {
          (unselectedPlaylists as any).push(playlistName);
        }

        if (playlist.liked === true) {
          const index = (selectedPlaylists as any).indexOf(playlistName);
          if (index > -1) {
              selectedPlaylists.splice(index, 1); // Remove the playlistName if it exists
          }
          const index2 = (unselectedPlaylists as any).indexOf(playlistName)
          if(index2 > -1){
            unselectedPlaylists.splice(index2, 1)
          }
        }
      }

      return {selectedPlaylists, unselectedPlaylists}
    } else {
      throw new Error("Failed to fetch playlists");
    }
  } catch (error) {
    console.error("Error fetching playlists:", error);
    toast.error("Failed to fetch playlists.");
    return {selectedPlaylists: [], unselectedPlaylists: []};
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
