var fs = require("fs"), 
    http = require("http"), 
    socketIO = require("socket.io"), 
    port = (process.argv[2]? +process.argv[2]:8000);
 
var app = {
    tick: 0, 
    pop: 0,
    paused: true, 
    width: 100,
    height: 80
};


var server = http.createServer(function(req, res) {
    try {
        if (req.url == "/") {
            res.writeHead(200, { "Content-type": "text/html"});
            res.end(fs.readFileSync(__dirname + "/index.html"));
        } else {
            var path = req.url.split('.');
            if (path[path.length-1] == 'js')
                res.writeHead(200, {"Content-type": "text/javascript"});
            else if(path[path.length-1] == 'css')
                res.writeHead(200, {"content-type": "text/css"})
            else
                res.writeHead(200, {"Content-type": "text/plain"});

            res.end(fs.readFileSync(__dirname + req.url));
        }
    } catch (e) {}
}).listen(port, "0.0.0.0", function() {
    console.log("Listening at: http://localhost:" + port);
});

socketIO.listen(server).on("connection", function (client) {
   console.log("client connected with id: " + client.id);
   
}).set("log level", 1);

function tick() {
    gridCopy = [];
    for (var i = 0; i < app.width*app.height; i++)
        gridCopy.push(false);
    for (var i = 0; i < app.width*app.height; i++) {
        var x = i%app.width, 
            y = (i-x)/app.width,
            n = neighbors(x,y);
        if (app.grid[i] && (n < 2 || n > 3)) {
            erase(x,y, gridCopy);
        } else if (!app.grid[i] && n==3) {
            fill(x,y, gridCopy);
        } else {
            gridCopy[i] = app.grid[i];
        }
    }
    app.grid = gridCopy;
    app.tick++;
    updateStatus();
}

function neighbors(x,y) {
    var c = 0, 
        i = y*app.width+x, 
        h = app.height-1;
    if (x > 0) {
        c += app.grid[i - 1] +
        (y > 0 ? +app.grid[i-app.width - 1] : 0) +
        (y < h ? +app.grid[i+app.width - 1] : 0);

    } if (x < app.width - 1) {
        c += app.grid[i + 1] +
        (y > 0 ? +app.grid[i-app.width + 1] : 0) +
        (y < h ? +app.grid[i+app.width + 1] : 0);

    } 
    c += (y > 0 ? +app.grid[i-app.width] : 0) +
         (y < h ? +app.grid[i+app.width] : 0);
    return c;
}