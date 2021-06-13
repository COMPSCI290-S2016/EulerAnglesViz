function makeCylinderMesh(axis, center, R, H, color) {
    cylinder = new PolyMesh();
    var vertexArr = [];
    var res = 100;
    var vals = [0, 0, 0];
    //Make the main cylinder part
    for (var i = 0; i < res; i++) {
        vertexArr.push([]);
        for (var j = 0; j < 2; j++) {
            vals[axis[0]] = R*Math.cos(i*2*3.141/res);
            vals[axis[1]] = R*Math.sin(i*2*3.141/res);
            vals[axis[2]] = H/2*(2*j-1)
            var v = vec3.fromValues(vals[0] + center[0], vals[1] + center[1], vals[2] + center[2]);
            vertexArr[i].push(cylinder.addVertex(v, color));
        }
    }
    //Make the faces
    var i2;
    for (var i1 = 0; i1 < res; i1++) {
        i2 = (i1+1) % res;
        cylinder.addFace([vertexArr[i1][0], vertexArr[i2][0], vertexArr[i2][1]]);
        cylinder.addFace([vertexArr[i1][0], vertexArr[i2][1], vertexArr[i1][1]]);
    }
    return cylinder;
}

function GimbalCanvas(glcanvas) {
    SimpleMeshCanvas(glcanvas, "GLEAT/Viewers"); //Call the boilerplate code to set up mouse interaction
    
    glcanvas.displayGimbals = true;
    
    glcanvas.initGimbals = function() {
        var bbox = this.mesh.getBBox();
        var center = bbox.getCenter();
        vec3.scale(center, center, -1);
        this.mesh.Translate(center); //Translate to origin
        bbox = this.mesh.getBBox();
        center = bbox.getCenter();
        var R = bbox.getDiagLength();
        var H = R/20.0;
        
        this.yawgimbal = makeCylinderMesh([0, 1, 2], center, R, H, vec3.fromValues(0, 1, 0));
        this.yawConnection = makeCylinderMesh([0, 2, 1], vec3.fromValues(center[0], center[1]-R*(1+1/10.0), center[2]), H/3, R/5.0, vec3.fromValues(0.5, 0.5, 0.5));
        
        this.pitchgimbal = makeCylinderMesh([0, 2, 1], center, R-R/20, H, vec3.fromValues(0, 1, 1));
        this.pitchConnection = makeCylinderMesh([1, 2, 0], vec3.fromValues(center[0]+R-R/20, center[1], center[2]), H/3, R/10.0, vec3.fromValues(0.5, 0.5, 0.5));
        
        this.rollgimbal = makeCylinderMesh([1, 2, 0], center, R-R/10, H, vec3.fromValues(1, 0, 0));
        this.rollConnection = makeCylinderMesh([0, 1, 2], vec3.fromValues(center[0], center[1], center[2]+R*(1-1/10.0)), H/3, R/10.0);
        
        this.meshConnection = makeCylinderMesh([0, 2, 1], vec3.fromValues(center[0], center[1]+R/2-R/10, center[2]), H/4, R*1.02, vec3.fromValues(0.5, 0.5, 0.5));
        
        this.yawAngle = 0.0;
        this.pitchAngle = 0.0;
        this.rollAngle = 0.0;
        this.camera.centerOnMesh(this.yawgimbal);
    }

	glcanvas.colorBlack = vec3.fromValues(0.0, 0.0, 0.0);
	glcanvas.colorWhite = vec3.fromValues(1.0, 1.0, 1.0);
	
	//Setup repaint function	
	glcanvas.repaint = function() {
		glcanvas.gl.viewport(0, 0, glcanvas.gl.viewportWidth, glcanvas.gl.viewportHeight);
		glcanvas.gl.clear(glcanvas.gl.COLOR_BUFFER_BIT | glcanvas.gl.DEPTH_BUFFER_BIT);
		
		var pMatrix = mat4.create();
		mat4.perspective(pMatrix, 45, glcanvas.gl.viewportWidth / glcanvas.gl.viewportHeight, glcanvas.camera.R/100.0, glcanvas.camera.R*2);
		var mvMatrix = glcanvas.camera.getMVMatrix();
		if (glcanvas.displayGimbals) {
		    glcanvas.yawConnection.render(glcanvas.gl, colorShader, pMatrix, mvMatrix, glcanvas.colorWhite, glcanvas.light1Pos, glcanvas.light2Pos, glcanvas.ambientColor);	
	    }
            
        var rotYaw = mat4.create();
        mat4.identity(rotYaw);
        mat4.rotateY(rotYaw, rotYaw, -glcanvas.yawAngle);
        mat4.multiply(mvMatrix, mvMatrix, rotYaw);
        if (glcanvas.displayGimbals) {
		    glcanvas.yawgimbal.render(glcanvas.gl, colorShader, pMatrix, mvMatrix, glcanvas.colorWhite, glcanvas.light1Pos, glcanvas.light2Pos, glcanvas.ambientColor);
		    glcanvas.pitchConnection.render(glcanvas.gl, colorShader, pMatrix, mvMatrix, glcanvas.colorWhite, glcanvas.light1Pos, glcanvas.light2Pos, glcanvas.ambientColor);	
	    }
		
        var rotPitch = mat4.create();
        mat4.identity(rotPitch);
        mat4.rotateX(rotPitch, rotPitch, -glcanvas.pitchAngle);
        mat4.multiply(mvMatrix, mvMatrix, rotPitch);
        if (glcanvas.displayGimbals) {
		    glcanvas.pitchgimbal.render(glcanvas.gl, colorShader, pMatrix, mvMatrix, glcanvas.colorWhite, glcanvas.light1Pos, glcanvas.light2Pos, glcanvas.ambientColor);
		    glcanvas.rollConnection.render(glcanvas.gl, colorShader, pMatrix, mvMatrix, glcanvas.colorWhite, glcanvas.light1Pos, glcanvas.light2Pos, glcanvas.ambientColor);	
	    }

		var rotRoll = mat4.create();
		mat4.identity(rotRoll);
		mat4.rotateZ(rotRoll, rotRoll, -glcanvas.rollAngle);
		mat4.multiply(mvMatrix, mvMatrix, rotRoll);
		if (glcanvas.displayGimbals) {
		    glcanvas.rollgimbal.render(glcanvas.gl, colorShader, pMatrix, mvMatrix, glcanvas.colorWhite, glcanvas.light1Pos, glcanvas.light2Pos, glcanvas.ambientColor);
		    glcanvas.meshConnection.render(glcanvas.gl, colorShader, pMatrix, mvMatrix, glcanvas.colorWhite, glcanvas.light1Pos, glcanvas.light2Pos, glcanvas.ambientColor);
		}
		glcanvas.mesh.render(glcanvas.gl, colorShader, pMatrix, mvMatrix, glcanvas.ambientColor, glcanvas.light1Pos, glcanvas.light2Pos, glcanvas.lightColor);
		
	}
	
}
