# Server Modules

## timer

### `timer.start(message)` : Void

> prints the message and start recording time.

- `message` : String


### `timer.end(message)` : Number

> prints the message with the spent time.  
returns the spent time in miliseconds.

- `message` : String


## log

### `log.setLogPath(path)` : Void

> sets the path of the text file to record log history.

- `path` : String


### `log.create(message)` : Void

> Create a log record of the message.

- `message` : String


## playlist

### `pl.setPlaylistPath(path)` : Void

> sets the path of the `json` file to store playlists data.

- `path` : String


### `pl.getPlaylist(clientID, playlistID)` : Array | null

> returns an Array of source paths.  
if requested playlist doesn't exist, returns null.

- `clientID` : String

- `playlistID` : String


### `pl.setPlaylist(clientID, playlistID, playlist)` : Void

> Sets a playlist with given id and list.

- `clientID` : String

- `playlistID` : String

- `playlist` : Array


### `pl.getAllPlaylists(clientID)` : Array | null

> returns an Array of user's playlists.  
if requested playlist doesn't exist, returns null.

- `clientID` : String



# Client Modules

## Global

### `createElementShortCut(tagName, attributes, childNodes)` : HTMLElement

> A Shortcut for creating an HTML Element.

- `tagName` : String

- `attributes` : Object
    > each `{"key" : "value"}` pairs will be set as `{"attribute name" : "value"}`

- `childNodes` : Array [Node1, Node2, ...]

### `header.DOM` : Object

> Header - DOM list 

- `primaryButton` : HTMLElement

- `primaryButton_icon` : HTMLElement

- `title` : HTMLElement

- `secondaryButton` : HTMLElement

- `secondaryButton_icon` : HTMLElement

### `timer.start(message)` : Void

> Shows the message via `console.log`, and starts recording time.

- `message` : String

### `timer.end(message)` : Number

> Stops recording time. Shows the message via `console.log` with how long did the record take.  
returns the spent time in miliseconds.

- `message` : String


## audio player

### `audio.status` : Object

> Status of player.

- `playlist` : String

    > ID of the playlist that is currently being played.

- `index` : Number

    > index of the song that is currently being played.



### `audio.playlist` : Object { String : Array }

> Object of playlists.  
each keys are playlistID, values are the Array of paths.  
*`playlistID : [path1, path2, ...]`*


### `audio.downloadPlaylist(playlistID)` : Promise

> updates `audio.playlist[playlistID]` asynchronously.    
resolves received data on success.

- `playlistID` : String

### `audio.uploadPlaylist(playlistID)` : Promise

> uploads `audio.playlist[playlistID]` asynchronously.    
resolves updated playlist on success.

- `playlistID` : String


## explorer

### `explorer.list` : Object

> Lists of folders/files data in current path.

- `folder` : Array

- `file` : Array


### `explorer.currentPath` : String

### `explorer.loadingPath` : String


### `explorer.readDir(path)` : Promise

> get a list of JSON data from server.  
resolves an Array of `{name: `String`, type: `String`, secured: `Boolean`}`

- `path` : String