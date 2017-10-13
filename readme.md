# Modules

## playlist

> * * *

> `setPlaylistPath(path)`
>
> sets the path of the `json` file to store playlists data.

- `path` : String

> `return` : Void


> * * *

> `getPlaylist(clientID, playlistID)`
>
> returns an Array of source paths  
if requested playlist doesn't exist, returns null.

- `clientID` : String

- `playlistID` : String

> `return` : Array || null


> * * *

> `setPlaylist(clientID, playlistID, playlist)`
>
> .

- `clientID` : String

- `playlistID` : String

- `playlist` : Array

> `return` : Void


> * * *

> `getAllPlaylists(clientID)`
>
> returns an Array of user's playlists  
if requested playlist doesn't exist, returns null.

- `clientID` : String

> `return` : Array || null
