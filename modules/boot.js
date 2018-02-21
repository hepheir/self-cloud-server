'use strict';

const SETTINGS_PATH = '../settings.json';

const fs = require('fs');


// Loads settings
var settings = (function()
{
    let defaultSettings = {
        hostname: '127.0.0.1',
        port: 80,

        modules: [],

        driveRoot: './',
        logPath: './data/',
        playlistPath: './data/',
        
        supportedMediaTypes: {
            "audio": ["mp3", "ogg", "wav"],
            "video": ["mp4", "webm", "ogg"],
            "text" : ["txt"],
            "code" : ["c", "cp", "cpp", "py", "js", "html", "css"]
        }
    }

    let userSettings = new Object();

    // Import from settings.json
    try
    {
        if (fs.existsSync(SETTINGS_PATH))
        {
            let settingsFile = fs.readFileSync(SETTINGS_PATH);
            let settingsJSON = JSON.parse(settingsFile.toString());
    
            for (opt in defaultSettings)
            {
                if (typeof defaultSettings[opt] === typeof settingsJSON[opt])
                {
                    userSettings[opt] = settingsJSON[opt];
                }
                else
                {
                    throw `[${SETTINGS_PATH}] is outdated.`;
                }
            }
        }
        else
        {
            throw `[${SETTINGS_PATH}] is not found.`;
        }

    }
    catch (err)
    {
        console.log(err);

        userSettings = defaultSettings;

        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(userSettings));
        console.log(`Updated [${SETTINGS_PATH}].`);
    }
    finally
    {
        return userSettings;
    }
})();

