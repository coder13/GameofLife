var fs = require("fs"), 
    http = require("http"), 
    port = (process.argv[2]? +process.argv[2]:8000);
 
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
                res.writeHead(200, {"content-type": "text/javascript"})
            else
                res.writeHead(200, {"Content-type": "text/plain"});

            res.end(fs.readFileSync(__dirname + req.url));
        }
    } catch (e) {}
}).listen(port, "0.0.0.0", function() {
    console.log("Listening at: http://localhost:" + port);
});

var app = {
};

// socketIO.listen(server).on("connection", function (client) {
//    console.log("client connected with id: " + clients.toString());
   
// }).set("log level", 1);