# Modules

## timer

> * * *

> `start(message)`
>
> prints the message and start recording time.

- `message` : String

> `return` : Void


> * * *

> `end(message)`
>
> prints the message with the spent time.  
returns the spent time in miliseconds.

- `message` : String

> `return` : Number


## log

> * * *

> `setLogPath(path)`
>
> sets the path of the text file to record log history.

- `path` : String

> `return` : Void


> * * *

> `create(message)`
>
> Create a log record of the message.

- `message` : String

> `return` : Void


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
> returns an Array of source paths.  
if requested playlist doesn't exist, returns null.

- `clientID` : String

- `playlistID` : String

> `return` : Array | null


> * * *

> `setPlaylist(clientID, playlistID, playlist)`
>
> Sets a playlist with given id and list.

- `clientID` : String

- `playlistID` : String

- `playlist` : Array

> `return` : Void


> * * *

> `getAllPlaylists(clientID)`
>
> returns an Array of user's playlists.  
if requested playlist doesn't exist, returns null.

- `clientID` : String

> `return` : Array | null
