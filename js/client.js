var speeds = [1,2,4,5,10,15,20,25,30,40,50,75,100,150,200,250,300,400,500,750,1000];
var app = {
	tick: 0, 
	pop: 0,  
	paused: true, 
	currSpeed: 8
},  
client = {
	pixelWidth: 10, 
	connected: false
}, 
canvas;
app.speed = speeds[app.currSpeed];


$(document).ready(function() {
	canvas = document.getElementById('canvas');
	canvas.width = Math.floor(window.innerWidth/client.pixelWidth)*client.pixelWidth;
	canvas.height = Math.floor((window.innerHeight-22)/client.pixelWidth)*client.pixelWidth;

	if (canvas.getContext) {
		client.ctx = canvas.getContext('2d');

		try {
			client.iosocket = io.connect();

			client.iosocket.on("connect", function () {
				$("#connection").removeClass('disconnected');
				$("#connection").addClass('connected');
				client.connected = true;
			});

			client.iosocket.on("disconnect", function() {
				$("#connection").removeClass('connected');
				$("#connection").addClass('disconnected');
				client.connected = false;
				reset();
			});

			client.iosocket.on("init", function(data) {
				data = JSON.parse(data);
				client.id = data.id;
				app = data.appData;
				client.pixelWidth = Math.min(Math.floor(canvas.width/app.width), Math.floor(canvas.height/app.height));
				draw();
			});

			client.iosocket.on("put", function(data) {
				data = JSON.parse(data);
				if (data.fill) {
					fill(data.x, data.y);
				} else {
					erase(data.x, data.y);
				}
				updateStatus();
			});

			client.iosocket.on('tick', function(data) {
				data = JSON.parse(data);
				data.changes.forEach(function (c) {
					if (c.fill) {
						fill(c.x, c.y);
					} else {
						erase(c.x, c.y);
					}
				});
				app.pop = data.pop;
				app.tick = data.tick;
				updateStatus();
			});

			client.iosocket.on('pause', function(data) {
				app.pause = JSON.parse(data).pause;
			});

			client.iosocket.on('reset', reset);

			client.iosocket.on('change', function (data) {
				data = JSON.parse(data);
				switch (data.property) {
					case "currSpeed":
						app.currSpeed = +data.value;
						app.speed = speeds[app.currSpeed];
						updateStatus();
						break;
					case "paused":
						app.paused = data.value;
						break;
				}
			});

		} catch (e) {
			console.log("Initalizing grid with dimensions: " + app.width + " / " + app.height);
			
			app.width = canvas.width/client.pixelWidth;
			app.height = canvas.height/client.pixelWidth;

			app.grid = [];
			for (i = 0; i < app.width * app.height; i++)
				app.grid.push(false);
		}

		document.addEventListener("keydown", keyDown, false);
		$("#canvas").on('mousedown', mouse.down);
		$("#canvas").on('mousemove', mouse.move);
		$("#canvas").on('mouseup', mouse.up);

		$("#reset").on('click', function(data) {
			reset(); 

			if (client.iosocket)
				client.iosocket.emit('reset');
		});

		$("#increaseSpeed").on('click', function (event) {
			if (app.currSpeed > 0) {
				app.speed = speeds[--app.currSpeed];
				
				if (client.iosocket)
					client.iosocket.emit('change', JSON.stringify({property: "currSpeed", value: app.currSpeed}));
				updateStatus();
			} 
		});
		$("#decreaseSpeed").on('click', function (event) {
			if (app.currSpeed < speeds.length-1) {
				app.speed = speeds[++app.currSpeed];

				if (client.iosocket)
					client.iosocket.emit('change', JSON.stringify({property: "currSpeed", value: app.currSpeed}));
				updateStatus();
			}
		});

		draw();
	} else {
		console.log("Canvas not supported!");
	}
});

function reset() {
	app.tick = 0;
	app.pop = 0;
	app.paused = true;
	app.currSpeed = 8;
	app.speed = speeds[app.currSpeed];
	for (i = 0; i < app.width * app.height; i++)
		app.grid[i] = false;
	draw();
}

function tick() {
	if (client.iosocket)
		client.iosocket.emit('tick');

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

loop = function(start) {
  _loop = function() {
    tick();
    if (!app.paused)
      window.setTimeout(_loop, app.speed);
  }
  if (start)
    _loop();
}
  
function draw() {
	if (app.grid) {
		client.ctx.clearRect(0, 0, canvas.width, canvas.height);
		var x = 0, y = 0;
		for (i = 0; i < app.grid.length; i++) {
			var c = Math.floor(app.grid[i] ? 64 : 196);
			client.ctx.fillStyle = "rgb(" + c + "," + c + "," + c + ")";
			x = i % app.width;
			y = (i - x) / app.width;
	        client.ctx.fillRect(x * client.pixelWidth + 1, y * client.pixelWidth + 1, client.pixelWidth - 1, client.pixelWidth - 1);
		}
	}
	updateStatus();
}

function keyDown(event) {
	switch (event.which) {
		case 32: // Space
			event.preventDefault();
			tick();
			updateStatus();
			break;
		case 13: 
			event.preventDefault();
			app.paused = !app.paused;
			if (client.iosocket) {
				client.iosocket.emit('pause');
			} else {
				loop(!app.paused);
			}
			break;
	}
}

var mouse = {
	held: false, 
	down: function(event) {
		event.preventDefault();
		mouse.held = true;
		put(event.which);
	}, 
	up: function(event) {
		event.preventDefault();
		mouse.held = false;
	}, 
	move: function(event) {
		event.preventDefault();
		if (mouse.held) {
			put(event.which);
		}
	}
}

function put(w) {
	var x = Math.floor((event.offsetX || event.clientX - canvas.offsetLeft) / client.pixelWidth),
		y = Math.floor((event.offsetY || event.clientY - canvas.offsetTop) / client.pixelWidth);

	if (w==2) {
		console.log([x,y].toString() + "\t" + neighbors(x,y));
		return;
	}
	
	var v = app.grid[y*app.width+x];
	if (v && w==3) {
		erase(x,y);
		if (client.iosocket)
			client.iosocket.emit("put", JSON.stringify({fill: false, x: x, y: y}));
	} else if (!v && w!=3){
		fill(x,y);
		if (client.iosocket)
			client.iosocket.emit("put", JSON.stringify({fill: true, x: x, y: y}));
	}
	updateStatus();
}

function fill(x, y, grid) {
	if (x < 0 || y < 0 || x >= app.width || y >= app.height)
		return;
	if (!app.grid[y*app.width+x]) {
		app.pop++;
		client.ctx.fillStyle = "rgb(64,64,64)";
		client.ctx.fillRect(x*client.pixelWidth+1, y*client.pixelWidth+1, client.pixelWidth-1, client.pixelWidth-1);
		(grid ? grid : app.grid)[y*app.width+x] = true;
	}
}

function erase(x, y, grid) {
	if (x < 0 || y < 0 || x >= app.width || y >= app.height)
		return;
	if (app.grid[y*app.width+x]) {
		app.pop--;
		client.ctx.fillStyle = "rgb(196,196,196)";
		client.ctx.fillRect(x*client.pixelWidth+1, y*client.pixelWidth+1, client.pixelWidth-1, client.pixelWidth-1);
		(grid ? grid : app.grid)[y*app.width+x] = false;
	}
}

function updateStatus() {
	$("#gen").text(app.tick);
	$("#pop").text(app.pop);
	$("#speed").text(Math.round((1000/app.speed)*10)/10);
	if (app.currSpeed == 0)
		$("#ts").text("tick / sec");
	else
		$("#ts").text("ticks / sec");

	$("#dimensions").text(app.width + " / " + app.height);
}

function changeSpeed(speed) {
	app.speed = speed;
	updateStatus();
}