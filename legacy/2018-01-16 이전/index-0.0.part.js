
app.get('/drive/', (req, res) => {
    let path = ROOT_PATH + req.path.split('/drive/')[1],
        source = new Object();

    console.log('get: ', req.query, req.path, req.params, path);

    log.create(`<${req.ip}> access to [${path}]`);

    if (!fs.existsSync(path)) {
        res.send(renderPage('error', req.source));
        return;

    } else if (!fs.statSync(path).isDirectory()) {
        res.send(renderPage('error', req.source));
        return;

    }

    source.parent  = path.match(/([^/]+)\/([^/]+)(\/$|$)/)[0].split('/')[0];
    source.current = path.match(/([^/]+)(\/$|$)/)[0].split('/')[0];

    let content = renderPage('drive', source);
    res.send(content);
})

app.post(/^\/lll\//, (req, res) => {
    let path = ROOT_PATH + req.params[0],
        client = req.cookies.id;
        
    console.log('post: ', req.query, req.path, req.params, path, client);

    if (client != 'hepheir') {
        res.send('no access level');
        return;
    }

    if (!fs.existsSync(path)) {
        res.send(null);
        return;

    } else if (!fs.statSync(path).isDirectory()) {
        res.send(null);
        return;

    }

    let files = fs.readdirSync(path);
    files = files.map(f => {
        return {
            name: f,
            type: fileType(path),
            secured: false
        };
    })


    files = JSON.stringify(files);
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.send(files);
})


/* Default
app.get('/', (req, res) => {
    console.log('default');
    res.send('<script>location.assign("/drive")</script>');
})

*/
