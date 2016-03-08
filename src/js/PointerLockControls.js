THREE.PointerLockControls = function (camera, spaceWidth, spaceHeight, spaceDepth, spaceFloorHeight) {
	// console.log(spaceWidth, spaceHeight, spaceDepth)
	var scope = this,
		PI_2 = Math.PI / 2,
		yawObject = new THREE.Object3D();
		
	camera.rotation.set(-0.9, 0, 0);
	
	yawObject.position.y = spaceHeight * 2 + spaceFloorHeight;
	yawObject.position.x = spaceWidth * 1.02;
	yawObject.position.z = spaceDepth * 1.02;
	yawObject.rotation.y = 1;
	yawObject.add(camera);

	var onMouseMove = function ( event ) {
		if ( scope.enabled === false ) return;
		
		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0,
			movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		camera.rotation.x -= movementY * 0.002;
		camera.rotation.x = Math.max(-PI_2, Math.min(PI_2, camera.rotation.x));
	};

	document.addEventListener( 'mousemove', onMouseMove, false );

	this.enabled = false;

	this.getObject = function () {
		return yawObject;
	};
};
