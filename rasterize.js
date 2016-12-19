/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog3/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog3/spheres.json"; // spheres file loc
const TEXTURE_LOCATION = "https://chandrasekar-rajasekar.github.io/CGProject/";    //

var defaultEye; // default eye position in world space
var defaultCenter; // default view direction in world space
var defaultUp; // default view up vector
var lightAmbient = vec3.fromValues(1,1,1); // default light ambient emission
var lightDiffuse = vec3.fromValues(1,1,1); // default light diffuse emission
var lightSpecular = vec3.fromValues(1,1,1); // default light specular emission
var lightPosition = vec3.fromValues(0,1,0); // default light position
var rotateTheta = Math.PI/50; // how much to rotate models by with each key press
var isPerspective; //Displays the view in perspective mode if initialized with true.
const ObstacleName = "Obstacle";
const vehicleName = "vehicle";
const logsName = "logs";
const BackGroundName = "background";
var livesRemaining = 3;                      //no of frog lives remaining
var HighScore = 0;
var animationFrameId = undefined;   // id returned by request animation frame

const jumpDists = 0.15;
const Score1 = {"range":[-1, -0.9],"color":{"ambient": [0,0,0], "diffuse": [0,0,0], "specular": [0,0,0], "n": 1, "alpha": 1}};
const Land = {"range":[-0.9, -0.75],"color":{"ambient": [1,1,1], "diffuse": [1,1,1], "specular": [1,1,1], "n": 1, "alpha": 1}};
const Road = {"range":[-0.75, -0.15],"color":{"ambient": [1,1,1], "diffuse": [1,1,1], "specular": [1,1,1], "n": 1, "alpha": 1}};
const Sand = {"range":[-0.15, 0],"color":{"ambient": [1,1,1], "diffuse": [1,1,1], "specular": [1,1,1], "n": 1, "alpha": 1}};
const Water = {"range":[0, 0.75],"color":{"ambient": [1,1,1], "diffuse": [1,1,1], "specular": [1,1,1], "n": 1, "alpha": 1}};
const Grass = {"range":[0.75, 0.9],"color":{"ambient": [1,1,1], "diffuse": [1,1,1], "specular": [1,1,1], "n": 1, "alpha": 1}};
const Name = {"range":[0.9, 1.00],"color":{"ambient": [0,0,0], "diffuse": [0,0,0], "specular": [0,0,0], "n": 1, "alpha": 1}};


//boundaries the frog can go
const FrogMinz = Land.range[0]+(Land.range[1]-Land.range[0])/2;
const FrogMaxz = Grass.range[0]+(Grass.range[1]-Grass.range[0])/2
const FrogMaxx = 1-0.05;
const FrogMinx = -1+0.05;


//scores and levels
var Score = 0; var scrInc = 10;
var Level = 1;
/* webgl and geometry data */
var gl = null; // the all powerful gl triangle. It's all here folks!
var inputTriangles = []; // the triangle data as loaded from input files
var numTriangleSets = 0; // how many triangle sets in input scene
var inputSpheres = []; // the sphere data as loaded from input files
var numSpheres = 0; // how many spheres in the input scene
var vertexBuffers = []; // this contains vertex coordinate lists by set, in triples
var normalBuffers = []; // this contains normal component lists by set, in triples

var movingObjects = []; // this list contains all the objects that are continuously moving with time 
var idleObjects = []; // background and idle objects
var frogs = []; //this list contains all the objects that are stays idle or moves on specific occurence(like score and level update) 

var textureCoordBuffers = [];
var triSetSizes = []; // this contains the size of each triangle set
var triangleBuffers = []; // lists of indices into vertexBuffers by set, in triples
var viewDelta = 0; // how much to displace view with each key press

/* shader parameter locations */
var vPosAttribLoc; // where to put position for vertex shader
var vNormAttribLoc;
var ambientULoc; // where to put ambient reflecivity for fragment shader
var diffuseULoc; // where to put diffuse reflecivity for fragment shader
var specularULoc; // where to put specular reflecivity for fragment shader
var shininessULoc; // where to put specular exponent for fragment shader
var alphaULoc;       //where to put transparent component
var isTextureULoc;
var mMatrixULoc; // where to put model matrix for vertex shader
var pvmMatrixULoc; // where to put project model view matrix for vertex shader
var vTextureCoordLoc; //
var textureImageLoc; //
var Center = [0,0,0]; //TODO:remove it
var Eye = [0,0,0]; //TODO:Remove it
var Up = [0,1,0]; // TODO: Remove it

// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input spheres

// does stuff when keys are pressed
function handleKeyDown(event) {
    
	//check whether the current element focus is on canvas
	var CurrentFocus = document.activeElement;
	if(!CurrentFocus.contains(document.getElementById("myWebGLCanvas")))
		return;
	switch (event.code) {
        
        // model selection
        case "Space": // pause and resume the fielf
			if(animationFrameId === null){
				
			}else if(animationFrameId !== undefined){
				window.cancelAnimationFrame(animationFrameId);
				animationFrameId = undefined;
			}else{
				animationFrameId = window.requestAnimationFrame(renderModels); // set up frame render callbacks
			}
            break;
        case "ArrowRight": // moves the frog right
			if(frogs[frogs.length-1].i == 10){
				frogs[frogs.length-1].dir = "right";
				frogs[frogs.length-1].i = 0;
			}
            break;
        case "ArrowLeft": // moves the frog left
			if(frogs[frogs.length-1].i == 10){
				frogs[frogs.length-1].dir = "left";
				frogs[frogs.length-1].i = 0;
			}
            break;
        case "ArrowUp": // moves the frog forward
			if(frogs[frogs.length-1].i == 10){
				frogs[frogs.length-1].dir = "up";
				frogs[frogs.length-1].i = 0;
            }
            break;
        case "ArrowDown": // moves the frog backwards
			if(frogs[frogs.length-1].i == 10){
				frogs[frogs.length-1].dir = "down";
				frogs[frogs.length-1].i = 0;
            }
            break;
        case "Enter":
			newGame();
			break;
        // view change
        case "KeyA": 
            break;
        case "KeyD": 
            break;
        case "KeyS": 
            break;
        case "KeyW": 
            break;
        case "KeyQ": 
            break;
        case "KeyE": 
            break;
        case "Escape": 
            break;
            
        // model transformation
        case "KeyF": 
			isOrtho = false; 
			isPerspective = false; 
			isFrogView = true;
            break;
        case "Semicolon": 
            break;
        case "KeyL": 
            break;
        case "KeyO": 
			isOrtho = true; 
			isPerspective = false; 
			isFrogView = false;
            break;
        case "KeyI": 
            break;
        case "KeyP": 
			isOrtho = false; 
			isPerspective = true; 
			isFrogView = false;
            break;
        case "Backspace": 
            break;
    } // end switch
} // end handleKeyDown

//setsUpthe Score
function drawScore(){
	var scoreCanvas = document.getElementById('scoreCanvas');
	var ctx = scoreCanvas.getContext('2d');
	ctx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height);
	ctx.font = "20px serif";
	ctx.fillStyle = "white";
	ctx.textAlign = "left";
	ctx.fillText("Score: "+Score, 10, scoreCanvas.height);
	ctx.textAlign = "center";
	ctx.fillText("-3D FROGGER-", scoreCanvas.width/2, scoreCanvas.height);
	ctx.textAlign = "right";
	ctx.fillText("HighScore: "+HighScore, scoreCanvas.width-10, scoreCanvas.height);
	
	//lives and name
	var livesCanvas = document.getElementById('nameCanvas');
	var ctx = livesCanvas.getContext('2d');
	ctx.clearRect(0, 0, livesCanvas.width, livesCanvas.height);
	ctx.font = "20px serif";
	ctx.fillStyle = "white";
	ctx.textAlign = "left";
	ctx.fillText("Lives Remaining: "+livesRemaining, 10, livesCanvas.height-2);
	ctx.textAlign = "right";
	ctx.fillText("Level: "+Level, livesCanvas.width-10, livesCanvas.height-2);
}

// set up the webGL environment
function setupWebGL() {
    
    // Set up keys
    document.onkeydown = handleKeyDown; // call this when key pressed

    // Get the score canvas, to display scores and level
	drawScore();
    // create a webgl canvas and set it up
    var webGLCanvas = document.getElementById("myWebGLCanvas"); // create a webgl canvas
    gl = webGLCanvas.getContext("webgl"); // get a webgl triangle from it
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
		//set texture
		
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
	
	setUpEnvironment();
	makeUnitLog(0.05,0.1);
} // end setupWebGL

function setUpEnvironment(){
	 var grdType = [Score1,Land,Road,Sand,Water,Grass,Name];
	 var grdText = [null,"stone.jpg","road.jpg","sand.jpg","water.jpg","grass.jpg",null];
	 for(var i=0; i < grdType.length; i++){
		 var range = grdType[i].range;
		var grnd = makeRect(2,range[1]-range[0]);
		grnd.len = 2;
		var j = i+1;
		grnd.material = grdType[i].color;//{"ambient": [0.1,0.1,0.1], "diffuse": [0.1*j,0.2*j,0.15*j], "specular": [0.3,0.3,0.3], "n": 1, "alpha": 1};
		grnd.x = 0;//-whichSet/N;
		grnd.y = 0;               //change as you go by
		grnd.z = range[0]+(range[1]-range[0])/2;
		grnd = singleModelObject(grnd,BackGroundName,grdText[i]);
		idleObjects.push(grnd);
	 }
}
function makeRect(len,brth){
	var s = brth/2;
	var l;
	if(brth < 0.2)
		l = brth
	else
		l = 1;
	var boxVertices = [[-len/2,0,-s],[-len/2,0,s],[len/2,0,s],[len/2,0,-s]];
	var textureCords = [[0,0],[0,l],[1,l],[1,0]];
	var boxTriangles = [[0,1,2],[0,2,3]];
	return ({"vertices":boxVertices,"triangles":boxTriangles,"normals":boxVertices.slice(),"uv":textureCords,
	"texture":null,
	"TMatrix":mat4.create(),
	"subObjects":[]});
}
/*
Objects = {"vertices":[[],[]],
			"triangles":[[][]],
			"normals":[[][]],
			"texture":null,
			"TMatrix":
			"subObjects":[instance of Objects]}
*/




//makes a car/Truck
// car for lane 1 or 2. truck for lane 3 or 4
function makeVechicle(len,width,hgt,dir,lane){
	var disp,color;
	if(lane == 0 || lane == 1){
		disp = 0.6;
		color = {"ambient": [0.5,0.1,0.1], "diffuse": [0.5,0.1,0.1], "specular": [0.5,0.1,0.1], "n": 11, "alpha": 1};
	}else{
		disp = 0.8;
		color = {"ambient": [0.5,0.5,0.1], "diffuse": [0.5,0.5,0.1], "specular": [0.5,0.5,0.1], "n": 11, "alpha": 1};
	}
	var base = makeBox(len, width, hgt*0.6,dir);
	var topbox = makeBox(len*disp, width, hgt*0.4,dir);
	var shiftTri = topbox.triangles;
	for(var tri =0; tri < shiftTri.length; tri++){
		var triangle = shiftTri[tri];
		for(var i=0; i<3;i++)
			triangle[i] += base.vertices.length;
		base.triangles.push(triangle);
	}
	topbox.triangles = shiftTri;
	var translateVec =[0,0,0];
	if(dir > 0){
		translateVec =[-len*0.1,hgt*0.6,0];
	}else{
		translateVec =[len*0.1,hgt*0.6,0];
	}
	for(var v=0; v < topbox.vertices.length; v++){
		var vertex = topbox.vertices[v];
		vec3.add(vertex,vertex,translateVec);
		topbox.vertices[v] = vertex;
		base.vertices.push(vertex);
		base.normals.push(topbox.normals[v]);
		//base.uv.push(topbox.uv[v]);
	}
	base.material = color;
	return base;
        
}
function makeBoat(len,brth,dir){
		var vertices = [],triangles = [], textureCoord=[], normals = [];
		var color = {"ambient": [0.38,0.6,0.77], "diffuse": [0.38,0.6,0.77], "specular": [0.38,0.6,0.77], "n": 11, "alpha": 1};
		
		vertices.push([len/2,brth,0],[len/4,0,0]);  //0 - 1
		vertices.push([-len/2,brth,0],[-len/4,0,0]); // 2 - 3
		vertices.push([0,brth*0.75,-brth*0.75],[0,brth*0.75,+brth*0.75]); // 4 - 5
		vertices.push([0,brth,0]);  // 6
		
		triangles.push([0,1,4],[0,1,5],[2,3,4],[2,3,5]);
		triangles.push([1,3,5],[1,3,4]);
		triangles.push([1,3,6]);
		return ({"vertices":vertices,"triangles":triangles,"normals":vertices.slice(),"uv":[],
			"texture":null,
			"material":color,
			"TMatrix":mat4.create(),
			"subObjects":[]});
}
//generaates triangle coordinate for frog
function makeFrog(len){
	var bth= len/1.5;
	var color = {"ambient": [0.1,0.1,0.1], "diffuse": [0.1,0.75,0.25], "specular": [0.3,0.3,0.3], "n": 11, "alpha": 1};
	var center = [0,len*0.5,0];
	var topPt = [center[0],0.75*len,len];
	var vertices = [];
	var triangles = [];
	//0 - 1
	vertices.push(center,topPt);
	///legs
	//right fore leg  2 - 5
	vertices.push([0.9*bth,0.5*len,0.5*len],[0.75*bth,0.3*len,0.65*len],[0.95*bth, 0.12*len,0.75*len],[0.85*bth,0*len,0.85*len]);
	triangles.push([0,1,2], [0,2,3], [0,3,4], [0,4,5]);
	//left fore leg  6 - 9
	vertices.push([-0.9*bth,0.5*len,0.5*len],[-0.75*bth,0.3*len,0.65*len],[-0.95*bth, 0.12*len,0.75*len],[-0.85*bth,0*len,0.85*len]);
	triangles.push([0,1,6], [0,6,7], [0,7,8], [0,8,9]);
	
	
	//body 10
	vertices.push([0,len*0.75,0]);
	
	vertices.push([0.75*bth,0.5*len,0]);   //11
	triangles.push([1,10,11]);
	vertices.push([-0.75*bth,0.5*len,0]);  //12
	triangles.push([1,10,12]);
	
	
	//waist    // 13 - 14
	vertices.push([0.90*bth,0*len,0.2*len],[-0.90*bth,0*len,0.2*len]);
	triangles.push([11,12,13],[13,14,12]);
	
	//legs -- lowjoint 15,16
	vertices.push([0.25*bth,0,0.2*len],[-0.25*bth,0,0.2*len]);
	
	//right back leg 17 - 20
	vertices.push([0.95*bth,0.25*len,0],[0.65*bth,0.2*len,-0.35*len],[0.85*bth,0.1*len,-0.45*len],[0.75*bth,0,-0.6*len]);
	triangles.push([15,17,18],[15,18,19],[15,19,20]);
	
	//right back leg 21 - 24
	vertices.push([-0.95*bth,0.25*len,0],[-0.65*bth,0.2*len,-0.35*len],[-0.85*bth,0.1*len,-0.45*len],[-0.75*bth,0,-0.6*len]);
	triangles.push([16,21,22],[16,22,23],[16,23,24]);
	
	//attaching waist and leg. [13,14,17,21]
	triangles.push([13,14,17],[17,21,14]);
	
	return ({"vertices":vertices,"triangles":triangles,"normals":vertices.slice(),"uv":[],
	"texture":null,
	"material":color,
	"TMatrix":mat4.create(),
	"subObjects":[]});
}

//Make a log with curved surface
function makeUnitLog(length,width,dir){
	var vertices = [];
	var len = length/2;
	var r = width;
	var triangles = []; var textureCords = [];
	var normals = [];
	var step = Math.PI/12;
	var semi = [];
	var textureCoord = [];
	var lyr = 0.025;
	var color = {"ambient": [1,1,1], "diffuse": [1,1,1], "specular": [1,1,1], "n": 11, "alpha": 1};
	//totally 7 vertices / quadrant
	for(var theta=0; theta <= Math.PI/2; theta += step){
		var y = Math.sin(theta)*r;
		var z = Math.cos(theta)*r;
		semi.push([y,z]);
	}
	
	var n = 2*semi.length-1;
	var vStp = 1/(n-1);
	var totalLayer = length/lyr;
	var uStp = 1/totalLayer;
	
	var u = 0;
	//skipping one common vertex, we have 13 vertices per semi circle
	for(var x = -len; x <= len; x+=lyr){
		var v = 0;
		for(var yz=0; yz < semi.length; yz++){
			var pt = [x,semi[yz][0],semi[yz][1]];
			vertices.push(pt);
			normals.push(0,pt[1],pt[2]);
			textureCoord.push([u,v]);
			v += vStp;
		}
		for(var yz = semi.length-2; yz >=0; yz--){
			var pt = [x,semi[yz][0],-semi[yz][1]];
			vertices.push(pt);
			normals.push(0,pt[1],pt[2]);
			textureCoord.push([u,v]);
			v += vStp;
		}
			u += uStp;
		
	}
	
	//0 - 12
	//13 - 25
	//26 - 38
	for(var x = 1; x <= totalLayer+1; x++){
		//x-1 // x
		var st = x*n;
		for(var i=0; i < n-1; i++){
			triangles.push([st+i,st+i+1,st+i-n]);
			triangles.push([st+i-n,st+i+1-n,st+i+1]);
		}
		
	}
	
	var end = vertices.length;
	
	//triangles to cover each end of the log
	vertices.push([-len,0,0]);
	textureCoord.push([0.5,0.5]);
	normals.push([-1,0,0]);
	
	
	vertices.push([len,0,0]);
	textureCoord.push([0.5,0.5]);
	normals.push([1,0,0]);
	
	for(var j=0; j < 12; j++){
		triangles.push([end,j,j+1]);
		triangles.push([end+1,end-j-1,end-j-2]);
	}
	triangles.push();
	
	return ({"vertices":vertices,"triangles":triangles,"normals":normals,"uv":textureCoord,
	"texture":"wood.jpg",
	"material":color,
	"TMatrix":mat4.create(),
	"subObjects":[]});
}
function makeBox(len,brth,hgt,dir){
	function cude(p){
		var vertices = p;
		
		var triangle = [];
		triangle.push([0,1,2],[0,2,3]);
		triangle.push([4,5,6],[4,6,7]);
		triangle.push([0,1,5],[0,5,4]);
		triangle.push([2,3,7],[2,7,6]);
		triangle.push([1,2,6],[1,6,5]);
		triangle.push([0,3,7],[0,7,4]);
		return ({"vertices":vertices, "triangles":triangle});
	}
	var boxVertices = [[-len/2,hgt,-brth],[-len/2,hgt,brth],[-len/2,0,brth],[-len/2,0,-brth],
						[len/2,hgt,-brth],[len/2,hgt,brth],[len/2,0,brth],[len/2,0,-brth]];
	//var textureCords = [[],[],[],[],[],[],[],[]];
	var box =cude(boxVertices);
	
	return ({"vertices":box.vertices,"triangles":box.triangles,"normals":box.vertices.slice(),"uv":[],
	"texture":null,
	"TMatrix":mat4.create(),
	"subObjects":[]});
}
function loadmodels(){
	//var N = 4;
    // process each triangle set to load webgl vertex and triangle buffers
    numTriangleSets = inputTriangles.length; // remember how many tri sets
	var grndType = [Road,Water];
	var numLane = [4,5];       // 4 lanes in road and 5 on water
	var obstacleSize = [[0.20,0.20,0.25,0.35],[0.35,0.6,0.35,0.6,0.35]];
	var materialName = [vehicleName,logsName];
	//Vehicles and logs
    for(var grnd=0; grnd < 2; grnd++){
		var x,y,z;
		var range = grndType[grnd].range;
		var N = numLane[grnd];
		var dir = -1;                      //+ve is left to right
		for (var lane=0; lane<N; lane++) { // for each tri set
			var len = obstacleSize[grnd][lane];//0.15*(lane+1);
			var width = (range[1]-range[0])/N;
			var hgt;
			x = -lane/(grnd+1); 
			z = range[0] + (lane + 1/2)*(width);
			width -= 0.05;
			
			width /= 2;
			y = 0;
			if(lane ==0 || lane ==1)
				hgt = 0.06;
			else
				hgt = 0.09;
			var gap = 0.6;
			for(var i=0; i < 3; i++){
				x = (x - i*gap);
				if(grnd ==0)
					var box = makeVechicle(len,width,hgt,dir,lane); //makeBox(len,width,width,dir);
				else{
					if(lane == N-1){
						len *= 1.2; width *= 1.2;
						var box = makeBoat(len,width,dir);
					}
					else
						var box = makeUnitLog(len,width,dir);
				}
				box.dir = dir;
				box.len = len;
				box.width = width;
				box.height = hgt;
				box.speed = 0.2+(lane)/N*0.25;
				box.defaultSpeed = box.speed;
				box.x = x*box.dir;
				box.y = y;
				box.z = z;
				box = singleModelObject(box,materialName[grnd],box.texture);
				movingObjects.push(box);
			}
			dir *= -1;     //changes the direcction of vehicle
		}
	}
	
	//frog
	addNewFrog()
}

//adds new frog to the playing field
function addNewFrog(){
	var len = 0.05;
	var frog = makeFrog(len);
	frog.len = len;
	frog.width = len;
	frog.height = len;
	frog.dir = 0;
	frog.x = 0;
	frog.y = 0;//frog.width/2;
	frog.z = FrogMinz;
	frog.grnd = 0;
	frog.reached = false;
	frog.blink = false;   // frog blicks for 3 sec when got hit.
	frog.visible = true;  // useful while providing blink animation
	frog = singleModelObject(frog,"frog",null);
	frog.i = 10;frog.dir = "none";
	frogs.push(frog);
}
//adds the value for each field and changes the vertex coordinate into single large list
function singleModelObject(obj,objectName, textureName){
	
	var whichSetVert; // index of vertex in current triangle set
    var whichSetTri; // index of triangle in current triangle set
    var vtxToAdd; // vtx coords to add to the coord array
    var normToAdd; // vtx normal to add to the coord array
	var textToAdd;
    var triToAdd; // tri indices to add to the index array
	
	obj.center = vec3.fromValues(0,0,0);  // center point of tri set
    obj.on = false; // not highlighted
    obj.translation = vec3.fromValues(0,0,0); // no translation
    obj.xAxis = vec3.fromValues(1,0,0); // model X axis
    obj.yAxis = vec3.fromValues(0,1,0); // model Y axis 
				
				
	if(textureName != null){
		obj.newTexture = gl.createTexture();
		bindTextureFromSource(obj.newTexture,textureName);
		obj.material.isTexture = 1;
	}else{
		obj.newTexture = null;//gl.createTexture();
		obj.material.isTexture = 0;
	}

    // set up the vertex and normal arrays, define model center and axes
    obj.glVertices = []; // flat coord list for webgl
    obj.glNormals = []; // flat normal list for webgl
	obj.glTextures = []; 
    var numVerts = obj.vertices.length; // num vertices in tri set
    for (whichSetVert=0; whichSetVert<numVerts; whichSetVert++) { // verts in set
        vtxToAdd = obj.vertices[whichSetVert]; // get vertex to add
        normToAdd = obj.normals[whichSetVert]; // get normal to add
		textToAdd = [0,0];//obj.uvs[whichSetVert];
		if(obj.uv.length != 0)
			textToAdd = obj.uv[whichSetVert];
        obj.glVertices.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]); // put coords in set coord list
        obj.glNormals.push(normToAdd[0],normToAdd[1],normToAdd[2]); // put normal in set coord list
		obj.glTextures.push(textToAdd[0],textToAdd[1]);
        vec3.add(obj.center,obj.center,vtxToAdd); // add to ctr sum
    } // end for vertices in set
                
	vec3.scale(obj.center,obj.center,1/numVerts); // avg ctr sum

    // send the vertex coords and normals to webGL
				
	obj.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,obj.vertexBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(obj.glVertices),gl.STATIC_DRAW); // data in
				
    obj.normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,obj.normalBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(obj.glNormals),gl.STATIC_DRAW); // data in
			
	obj.uvBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,obj.uvBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.glTextures),gl.STATIC_DRAW);
           
    // set up the obj index array, adjusting indices across sets
    obj.glTriangles = []; // flat index list for webgl
    for (whichSetTri=0; whichSetTri<obj.triangles.length; whichSetTri++) {
        triToAdd = obj.triangles[whichSetTri]; // get tri to add
        obj.glTriangles.push(triToAdd[0],triToAdd[1],triToAdd[2]); // put indices in set list
    } // end for triangles in set

    // send the triangle indices to webGL
	obj.triangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.triangleBuffer); // activate that buffer
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(obj.glTriangles),gl.STATIC_DRAW); // data in
	obj.triangleBufferLength = obj.glTriangles.length;
	
				
	obj.shape = objectName;
	return obj;
}

// setup the webGL shaders
function setupShaders() {
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
        attribute vec3 aVertexPosition; // vertex position
        attribute vec3 aVertexNormal; // vertex normal
		attribute vec2 aTextureCoord;  // texture coordinates for this vertex
        
        uniform mat4 umMatrix; // the model matrix
        uniform mat4 upvmMatrix; // the project view model matrix
        
        varying vec3 vWorldPos; // interpolated world position of vertex
        varying vec3 vVertexNormal; // interpolated normal for frag shader
		
		varying highp vec2 textureCoord;

        void main(void) {
            
            // vertex position
            vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
            vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
            gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);

            // vertex normal (assume no non-uniform scale)
            vec4 vWorldNormal4 = umMatrix * vec4(aVertexNormal, 0.0);
            vVertexNormal = normalize(vec3(vWorldNormal4.x,vWorldNormal4.y,vWorldNormal4.z)); 
			
			textureCoord = aTextureCoord;
        }
    `;
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float; // set float to medium precision
		
		varying highp vec2 textureCoord;
		uniform sampler2D texture;
		
        // eye location
        uniform vec3 uEyePosition; // the eye's position in world
        
        // light properties
        uniform vec3 uLightAmbient; // the light's ambient color
        uniform vec3 uLightDiffuse; // the light's diffuse color
        uniform vec3 uLightSpecular; // the light's specular color
        uniform vec3 uLightPosition; // the light's position
        
        // material properties
        uniform vec3 uAmbient; // the ambient reflectivity
        uniform vec3 uDiffuse; // the diffuse reflectivity
        uniform vec3 uSpecular; // the specular reflectivity
        uniform float uShininess; // the specular exponent
		uniform float uAlpha;  // transparent component
        uniform float isTexture; 
		
        // geometry properties
        varying vec3 vWorldPos; // world xyz of fragment
        varying vec3 vVertexNormal; // normal of fragment
            
        void main(void) {
			vec4 textureColor;
			if(isTexture > 0.5)
				textureColor = texture2D(texture, vec2(textureCoord.s, textureCoord.t));
			else
				textureColor = vec4(1,1,1,1);
            // ambient term
            vec3 ambient = uAmbient*uLightAmbient; 
            
            // diffuse term
            vec3 normal = normalize(vVertexNormal); 
            vec3 light = normalize(uLightPosition - vWorldPos);
            float lambert = max(0.0,dot(normal,light));
            vec3 diffuse = uDiffuse*uLightDiffuse*lambert; // diffuse term
            
            // specular term
            vec3 eye = normalize(uEyePosition - vWorldPos);
            vec3 halfVec = normalize(light+eye);
            float highlight = pow(max(0.0,dot(normal,halfVec)),uShininess);
            vec3 specular = uSpecular*uLightSpecular*highlight; // specular term
            
            // combine to output color
            vec3 colorOut = ambient + diffuse + specular; // no specular yet
			
			if(isTexture > 0.5)
				gl_FragColor.rgb = textureColor.rgb;
			else
				gl_FragColor.rgb = uDiffuse*colorOut;////	
			gl_FragColor.a = uAlpha * textureColor.a;
			
        }
    `;
    
    try {
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                
                // locate and enable vertex attributes
                vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition"); // ptr to vertex pos attrib
                gl.enableVertexAttribArray(vPosAttribLoc); // connect attrib to array
                vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal"); // ptr to vertex normal attrib
                gl.enableVertexAttribArray(vNormAttribLoc); // connect attrib to array
				
				vTextureCoordLoc = gl.getAttribLocation(shaderProgram, "aTextureCoord");  //ptr to texture coord
				gl.enableVertexAttribArray(vTextureCoordLoc);
                
                // locate vertex uniforms
                mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix"); // ptr to mmat
                pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix"); // ptr to pvmmat
                
                // locate fragment uniforms
                var eyePositionULoc = gl.getUniformLocation(shaderProgram, "uEyePosition"); // ptr to eye position
                var lightAmbientULoc = gl.getUniformLocation(shaderProgram, "uLightAmbient"); // ptr to light ambient
                var lightDiffuseULoc = gl.getUniformLocation(shaderProgram, "uLightDiffuse"); // ptr to light diffuse
                var lightSpecularULoc = gl.getUniformLocation(shaderProgram, "uLightSpecular"); // ptr to light specular
                var lightPositionULoc = gl.getUniformLocation(shaderProgram, "uLightPosition"); // ptr to light position
				textureImageLoc = gl.getUniformLocation(shaderProgram,"texture");
                ambientULoc = gl.getUniformLocation(shaderProgram, "uAmbient"); // ptr to ambient
                diffuseULoc = gl.getUniformLocation(shaderProgram, "uDiffuse"); // ptr to diffuse
                specularULoc = gl.getUniformLocation(shaderProgram, "uSpecular"); // ptr to specular
                shininessULoc = gl.getUniformLocation(shaderProgram, "uShininess"); // ptr to shininess 
                alphaULoc = gl.getUniformLocation(shaderProgram, "uAlpha"); // ptr to alpha isTexture
                isTextureULoc = gl.getUniformLocation(shaderProgram, "isTexture"); // ptr to alpha 
                
                // pass global constants into fragment uniforms
                gl.uniform3fv(eyePositionULoc,Eye); // pass in the eye's position
                gl.uniform3fv(lightAmbientULoc,lightAmbient); // pass in the light's ambient emission
                gl.uniform3fv(lightDiffuseULoc,lightDiffuse); // pass in the light's diffuse emission
                gl.uniform3fv(lightSpecularULoc,lightSpecular); // pass in the light's specular emission
                gl.uniform3fv(lightPositionULoc,lightPosition); // pass in the light's position
				
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// render the loaded model
function renderModels() {
    
	//sortObjects();
	
/* interaction variables */
	//var Eye; // eye position in world space
	//var Center; // view direction in world space
	//var Up;// view up vector in world space
	
	newMovingObjectPos();
	if(animationFrameId === null)
		return;
	
	drawScore();
	var renderObjects = [];
	
	if(isPerspective){
		defaultEye = vec3.fromValues(0,0.5,-0); // default eye position in world space perspective view
		defaultUp = vec3.fromValues(0,1,0); // default view up vector perspective view
		Eye = vec3.clone(defaultEye);
		Eye[0] += frogs[frogs.length-1].x;
		Eye[2] += frogs[frogs.length-1].z-0.15;
		Center = vec3.clone(Eye);
		Center[1] = -0.1+Eye[1];
		Center[2] = 0.1+Eye[2];
	}else if(isFrogView){
		defaultEye = vec3.fromValues(0,0,0); // default eye position in world space perspective view
		defaultUp = vec3.fromValues(0,1,0); // default view up vector perspective view
		Eye = vec3.clone(defaultEye);
		Eye[0] += frogs[frogs.length-1].x;
		Eye[1] += frogs[frogs.length-1].y + frogs[frogs.length-1].width/2;
		Eye[2] += frogs[frogs.length-1].z + frogs[frogs.length-1].width;
		Center = vec3.clone(Eye);
		Center[2] = 0.1+Eye[2];
	}else{
		defaultEye = vec3.fromValues(0,0.9,0); // default eye position in world space orthogonal view
		defaultCenter = vec3.fromValues(0,0,0); // default view direction in world space orthogonal view
		defaultUp = vec3.fromValues(0,0,1); // default view up vectorin world space orthogonal view
		
		Eye = vec3.clone(defaultEye);
		Center = vec3.clone(defaultCenter);
	}
	Up = vec3.clone(defaultUp); 
	renderObjects = renderObjects.concat(idleObjects);
	renderObjects = renderObjects.concat(movingObjects);
	renderObjects = renderObjects.concat(frogs);
    // construct the model transform matrix, based on model state
    function makeModelTransform(currModel) {
        var zAxis = vec3.create(), sumRotation = mat4.create(), temp = mat4.create(), negCenter = vec3.create();

        vec3.normalize(zAxis,vec3.cross(zAxis,currModel.xAxis,currModel.yAxis)); // get the new model z axis
        mat4.set(sumRotation, // get the composite rotation
            currModel.xAxis[0], currModel.yAxis[0], zAxis[0], 0,
            currModel.xAxis[1], currModel.yAxis[1], zAxis[1], 0,
            currModel.xAxis[2], currModel.yAxis[2], zAxis[2], 0,
            0, 0,  0, 1);
        vec3.negate(negCenter,currModel.center);
        mat4.multiply(sumRotation,sumRotation,mat4.fromTranslation(temp,negCenter)); // rotate * -translate
        mat4.multiply(sumRotation,mat4.fromTranslation(temp,currModel.center),sumRotation); // translate * rotate * -translate
        mat4.fromTranslation(mMatrix,currModel.translation); // translate in model matrix
        mat4.multiply(mMatrix,mMatrix,sumRotation); // rotate in model matrix
    } // end make model transform
    
    var hMatrix = mat4.create(); // handedness matrix
    var pMatrix = mat4.create(); // projection matrix
    var vMatrix = mat4.create(); // view matrix
    var mMatrix = mat4.create(); // model matrix
    var hpvMatrix = mat4.create(); // hand * proj * view matrices
    var hpvmMatrix = mat4.create(); // hand * proj * view * model matrices
    const highlightMaterial = {ambient:[0.5,0.5,0], diffuse:[0.5,0.5,0], specular:[0,0,0], n:1}; // hlht mat
    
    animationFrameId = window.requestAnimationFrame(renderModels); // set up frame render callbacks
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
    // set up handedness, projection and view
    mat4.fromScaling(hMatrix,vec3.fromValues(-1,1,1)); // create handedness matrix
	if(isPerspective || isFrogView)
		mat4.perspective(pMatrix,0.5*Math.PI,1,0.01,10); // create projection matrix
	else
		mat4.ortho(pMatrix, -1, 1, -1, 1, -1, 1); //create projection matrix
    mat4.lookAt(vMatrix,Eye,Center,Up); // create view matrix
    mat4.multiply(hpvMatrix,hMatrix,pMatrix); // handedness * projection
    mat4.multiply(hpvMatrix,hpvMatrix,vMatrix); // handedness * projection * view

    // render each triangle set
    var object, setMaterial, instanceTransform = mat4.create(); // the tri set and its material properties
    for (var whichSet=0; whichSet<renderObjects.length; whichSet++) {
        object = renderObjects[whichSet];
		if(whichSet == renderObjects.length-1){
			if(object.visible == false)
				continue;
		}
		if(object.shape == vehicleName || object.shape == logsName){
			if(object.x + object.len/2 < -1)
				continue;
		}
        // make model transform, add to view project
        makeModelTransform(object);
		mat4.fromTranslation(instanceTransform,vec3.fromValues(object.x,object.y,object.z)); // recenter sphere
		//mat4.scale(mMatrix,mMatrix,vec3.fromValues(object.r,object.r,object.r)); // change size
		mat4.multiply(mMatrix,instanceTransform,mMatrix); // apply recenter sphere
		
        mat4.multiply(hpvmMatrix,hpvMatrix,mMatrix); // handedness * project * view * model
        gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // pass in the m matrix
        gl.uniformMatrix4fv(pvmMatrixULoc, false, hpvmMatrix); // pass in the hpvm matrix
        
        // reflectivity: feed to the fragment shader
        if (object.on){
            setMaterial = highlightMaterial; // highlight material
			
			setMaterial.alpha = object.material.alpha;
			setMaterial.isTexture = object.material.isTexture;
			
		}else{
			setMaterial = object.material;
		}
		//alert(setMaterial.texture);
		if(setMaterial.alpha == 1){
			gl.depthMask(true);
			gl.disable(gl.BLEND);
		}else{
			gl.depthMask(false);
			gl.enable(gl.BLEND);
		}
		//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		
        gl.uniform3fv(ambientULoc,setMaterial.ambient); // pass in the ambient reflectivity
        gl.uniform3fv(diffuseULoc,setMaterial.diffuse); // pass in the diffuse reflectivity
        gl.uniform3fv(specularULoc,setMaterial.specular); // pass in the specular reflectivity
        gl.uniform1f(shininessULoc,setMaterial.n); // pass in the specular exponent
		gl.uniform1f(alphaULoc,setMaterial.alpha);
		gl.uniform1f(isTextureULoc, setMaterial.isTexture);
        
	
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, object.newTexture);           //load Triangle texture into register 0
		gl.uniform1i(textureImageLoc, 0);                     // use register 0 to fragment shader;
		
        // vertex buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER,object.vertexBuffer); // activate
        gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed
        gl.bindBuffer(gl.ARRAY_BUFFER,object.normalBuffer); // activate
        gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed
        gl.bindBuffer(gl.ARRAY_BUFFER,object.uvBuffer); // activate
        gl.vertexAttribPointer(vTextureCoordLoc,2,gl.FLOAT,false,0,0); // feed

        // triangle buffer: activate and render
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,object.triangleBuffer); // activate
        gl.drawElements(gl.TRIANGLES,object.triangleBufferLength,gl.UNSIGNED_SHORT,0); // render
        
    } // end for each triangle set
    
    // render each sphere
} // end render model

//creates a texture, binds the image with given source and return the texture.
function bindTextureFromSource(Texture,src){
	//var Texture = gl.createTexture();
	var textureImage = new Image();
	textureImage.crossOrigin = "Anonymous";
	textureImage.onload = function(){
		gl.bindTexture(gl.TEXTURE_2D, Texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};
	textureImage.src = TEXTURE_LOCATION+src;
	//return Texture;
}

function checkIntersection(obj,frog){
	var frogUp = frog.z + frog.width/2;
	var frogDown = frog.z - frog.width/2;
	var frogLeft = frog.x - frog.len/2;
	var frogRight = frog.x + frog.len/2;
	
	if((frogUp > obj.z-obj.width/2 && frogUp < obj.z+obj.width/2) ||
	   (frogDown > obj.z-obj.width/2 && frogDown < obj.z+obj.width/2)){
		if((frogLeft > obj.x-obj.len/2 && frogLeft < obj.x+obj.len/2) ||
		   (frogRight > obj.x-obj.len/2 && frogRight < obj.x+obj.len/2)){
			return true;
		}
	}
	return false;
}

function gameOver(){
	
	alert("GAME OVER");
	if(Score >= HighScore){
		HighScore = Score;
		alert("NEW Highscore\n" + HighScore);
	}
	if(animationFrameId!==undefined || animationFrameId !==null)
		window.cancelAnimationFrame(animationFrameId);
	animationFrameId = null;
}

function newGame(){
	if(animationFrameId!==undefined || animationFrameId !==null)
		window.cancelAnimationFrame(animationFrameId);
	frogs=[];
	moveObstacle()
	livesRemaining=3;
	addNewFrog();
	Level = 1;
	Score = 0;
	animationFrameId = window.requestAnimationFrame(renderModels); // set up frame render callbackss
}

	
//freezes the obstacle in current position
function freezeObstacle(){
	for(var i = 0 ; i < movingObjects.length; i++){
		var obj = movingObjects[i];
		obj.speed = 0;
	}
}
	
//moves the obstacle Again
function moveObstacle(){
	for(var i = 0 ; i < movingObjects.length; i++){
		var obj = movingObjects[i];
		obj.speed = obj.defaultSpeed;
	}
}
	
//changes the position of the vehicle and logs
function newMovingObjectPos(){
	
	//starts from initial position and decrements current lives
	function resetFrog(frog){
		livesRemaining--;
		if(livesRemaining < 0 && frog.blink == false){
			gameOver();
			return;
		}
		moveObstacle();
		frog.dir = "none";
		frog.i = 10;
		frog.x = 0;
		frog.y = 0;
		frog.z = FrogMinz;
	}

	var isLogOrAir = false;
	var frog = frogs[frogs.length-1];
	frog.grnd = 0;
	var isOnWaterArea = frog.z + frog.width/2 > Water.range[0] && frog.z - frog.width/2 < Water.range[1];
	var isOnRoadarea = frog.z + frog.width/2 > Road.range[0] && frog.z - frog.width/2 < Road.range[1];
	//check the intraction of frog with vehicle or log
	for(var i = 0; i < movingObjects.length; i++){
		var obj = movingObjects[i];
		obj.x += obj.speed*0.01*Level*obj.dir;
		if(obj.dir ==1 && obj.x-obj.len/2 > 1){
			obj.x = -1 - obj.len/2;
		}else if(obj.dir == -1 && obj.x+obj.len/2 < -1){
			obj.x = 1 + obj.len/2;
		}
		
		if(frog.blink == true)
			continue;
		//frog dashes with vehicle - its dead
		if(isOnRoadarea){
			if(checkIntersection(obj,frog)){
				frog.i = 100;
				freezeObstacle();
				frog.blink = true;      //blink represents its dead
			}	
		}else if(isOnWaterArea){            //frog is on log, it should move along with log
			if(checkIntersection(obj,frog)){
				isLogOrAir = true;
				var nxt = obj.speed*0.01*Level*obj.dir;
				if(frog.x+nxt <= FrogMaxx && frog.x+nxt >= FrogMinx)
					frog.x += nxt;
				frog.grnd = obj.width;
			}
			if(frog.y  > frog.grnd){
				isLogOrAir = true;
			}
		}
	}
	//blinks of frogs since it struct the obstacle
	if(frog.blink == true){
			//if((Math.floor(frog.i/5))%2 == 0)
			if(frog.i%20 == 0)
				frog.visible = !frog.visible;
			if(frog.i == 0){
				frog.blink = false;
				resetFrog(frog);
			}
			frog.i--;
			return;
	}
	
	//frog jumped into the water
	if(!isLogOrAir && isOnWaterArea){
		frog.i = 100;
		freezeObstacle();
		frog.blink = true;      //blink represents its dead
	}
	//if we move the frog 
	for(var j = 0; j < frogs.length; j++){
		var frog = frogs[j];
		if(frog.reached)
			continue;
		var yJump = (frog.i < 5)?0.025:-0.025;
		if(frog.i != 10){
			switch (frog.dir){
				case "left":
					frog.y += yJump;
					if(frog.x-jumpDists/10 >= FrogMinx){
						frog.x -= jumpDists/10;
					}
					break;
				case "right":
					frog.y += yJump;
					if(frog.x+jumpDists/10 <= FrogMaxx){
						frog.x += jumpDists/10;
					}
					break;
				case "up":
					frog.y += yJump;
					Score += Level;
					if(frog.z+jumpDists/10 <= FrogMaxz){
						frog.z += jumpDists/10;
					}else{
						frog.reached = true;
						frog.y = 0;//frog.width/2;
						Level++;
						addNewFrog();
					}
					break;
				case "down":
					frog.y += yJump;
					if(frog.z-jumpDists/10 >= FrogMinz){
						frog.z -= jumpDists/10;
						Score -= Level;
					}
					break;
			}
			frog.i++;
		}else{
			frog.dir = "none";
			frog.y = frog.grnd;
		}
	}
}


/* MAIN -- HERE is where execution begins after window load */
function main() {
  OnClickView();
  setupWebGL(); // set up the webGL environment
  loadmodels(); // load in the models from tri file
  setupShaders(); // setup the webGL shaders
  renderModels(); // draw the triangles using webGL
  
} // end main

var isFrogView;
var isOrtho;
//JavaScript Onclick methods
function OnClickView(){
	isOrtho = true; //document.getElementById("ortho").checked;
	isPerspective = false; //document.getElementById("percp").checked;
	isFrogView = false; //document.getElementById("frogV").checked;
}
