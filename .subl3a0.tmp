var fs = require("fs"), 
    http = require("http"), 
    socketIO = require("socket.io"), 
    port = (process.argv[2]? +process.argv[2]:8000);

var speeds = [1,2,4,5,10,15,20,25,30,40,50,75,100,150,200,250,300,400,500,750,1000];
var app = {
    tick: 0, 
    pop: 0,
    paused: true, 
    currSpeed: 8,
    width: 100,
    height: 50
};
app.speed = speeds[app.currSpeed];

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

console.log("initializing grid");
app.grid = [];
for (var i = 0; i < app.width * app.height; i++) {
    app.grid.push(false);
}

socketIO.listen(server).on("connection", function (client) {
    console.log("client connected with id: " + client.id);
    client.emit('init', JSON.stringify({id: client.id, appData: app}));

    client.on('put', function(data) {
        client.broadcast.emit('put', data);
        data = JSON.parse(data);
        if (data.fill) {
            fill(app, data.x, data.y);
        } else {
            erase(app, data.x, data.y);
        }
    });

    client.on('tick', function(data) {
        change = tick(app);
        var changes = change[0];
        app = change[1];
        client.broadcast.emit('tick', JSON.stringify({changes: changes, pop: app.pop, tick: app.tick}));
    });

    client.on('reset', function(data) {
        console.log('reseting');
        reset();
        client.broadcast.emit('reset');
    });

    client.on('change', function(data) {
        client.broadcast.emit('change', data);
        data = JSON.parse(data);
        switch (data.property) {
            case "currSpeed": 
                app.currSpeed = +data.value;
                app.speed = speeds[app.currSpeed];
                break; 
            case "paused": 
                app.paused = data.value;
                break;
        }
    });

}).set("log level", 1);

function reset() {
    app.tick = 0;
    app.pop = 0;
    app.paused = true;
    app.currSpeed = 8;
    app.speed = speeds[app.currSpeed];
    for (i = 0; i < app.width * app.height; i++)
        app.grid[i] = false;
}

function tick(room) {
    var roomCopy = {width: room.width, height: room.height, tick: room.tick, pop: room.pop, paused: room.paused}, changes = [];
    roomCopy.grid = [];
    for (var i = 0; i < room.width*room.height; i++) {
        roomCopy.grid.push(false);
        var x = i%room.width, 
            y = (i-x)/room.width,
            n = neighbors(room, x,y);

        if (room.grid[i] && (n < 2 || n > 3)) { // erase        
            roomCopy.pop--;
            roomCopy.grid[i] = false;
            changes.push({fill: false, x: x, y: y});
        } else if (!room.grid[i] && n==3) { // fill
            roomCopy.pop++;
            roomCopy.grid[i] = true;    
            changes.push({fill: true, x: x, y: y});
        } else
            roomCopy.grid[i] = room.grid[i];

    }

    roomCopy.tick++;
    room = roomCopy;
    
    return [changes, room];
}

function neighbors(room, x,y) {
    var c = 0, 
        i = y*room.width+x, 
        h = room.height-1;
    if (x > 0) {
        c += room.grid[i - 1] +
        (y > 0 ? +room.grid[i-room.width - 1] : 0) +
        (y < h ? +room.grid[i+room.width - 1] : 0);

    } if (x < room.width - 1) {
        c += room.grid[i + 1] +
        (y > 0 ? +room.grid[i-room.width + 1] : 0) +
        (y < h ? +room.grid[i+room.width + 1] : 0);

    } 
    c += (y > 0 ? +room.grid[i-room.width] : 0) +
         (y < h ? +room.grid[i+room.width] : 0);
    return c;
}

function fill(room, x, y) {
    if (x < 0 || y < 0 || x >= room.width || y >= room.height)
        return;
    if (!room.grid[y*room.width+x]) {
        room.pop++;
        room.grid[y*room.width+x] = true;
    }
}

function erase(room, x, y) {
    if (x < 0 || y < 0 || x >= room.width || y >= room.height)
        return;
    if (room.grid[y*room.width+x]) {
        room.pop--;
        room.grid[y*room.width+x] = false;
    }
}