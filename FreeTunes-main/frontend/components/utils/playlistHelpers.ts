export const handlePlaylistClick = (
  selectedPlaylist: string | null,
  playlist: string,
  setSelectedPlaylist: React.Dispatch<React.SetStateAction<string | null>>
) => {
  if (selectedPlaylist === playlist) {
    setSelectedPlaylist(null);
  } else {
    setSelectedPlaylist(playlist);
  }
};

export const handleCreatePlaylist = (
  newPlaylistName: string,
  createPlaylist: (playlistName: string, songName: string, artistName: string) => void,
  setNewPlaylistName: React.Dispatch<React.SetStateAction<string>>,
  setShowCreateInput: React.Dispatch<React.SetStateAction<boolean>>,
  songName: string, 
  artistName: string
) => {
  if (!newPlaylistName.trim()) {
    return;
  }
  createPlaylist(newPlaylistName, songName, artistName);
  setNewPlaylistName("");
  setShowCreateInput(false);
};

export const handleSubmit = (
  selectedPlaylist: string | null,
  content: string,
  onClose: () => void,
  onPlaylistSelect: (playlistName: string) => void
) => {
  if (!selectedPlaylist) {
    alert("Please select or create a playlist first.");
    return;
  }
  
  onPlaylistSelect(selectedPlaylist);

  console.log(`Content "${content}" added to playlist: ${selectedPlaylist}`);

  onClose();
};
