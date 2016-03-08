window.onload = function(){
			'use strict';
			var camera, scene, renderer, data, backJSON,
				geometry, material, mesh,
				controls,
				objects = [],
				raycaster,
				controlsEnabled = false,
				
				moveForward = false,
				moveBackward = false,
				moveLeft = false,
				moveRight = false,
				moveUp = false,
				moveDown = false;
				
			checkBrowser();
			
			var prevTime = performance.now(),
				velocity = new THREE.Vector3(),
				view = {},
				views = [],
				status = {
					play: false,
					playOver: false,
					flySpeedRadio: 30,
					objectsSpeedRadio: 4,
					sceneExceptBoxLength: 4,
					spaceUsed: 0,
					pallet: {
						id: 0,
						stepIndex: 0,
						boxList: []
					}
				},
				config = {
					// 基本货物大小
					cube: {
						x: 10,
						y: 10,
						z: 10
					},
					threeView: { // 数字代表 屏幕长宽中较小的那个的倍数
						width: 0.2,
						height: 0.2,
						margin: 0.02
					},
					flySpeed: 100,
					objectsSpeed: 10,
					standardSize: 10,
					innerWidth: window.innerWidth,
					innerHeight: window.innerHeight,
					innerMin: Math.min(window.innerWidth, window.innerHeight)
				};
				
			// 请求数据
			(function(){
				var xmlhttp = new XMLHttpRequest();
				xmlhttp.open("GET", "data.json?rand=" + Math.random(), true);
				xmlhttp.send();
				xmlhttp.onreadystatechange = function() {
					if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
						backJSON = xmlhttp.responseText;
						data = JSON.parse(backJSON);
						// data.config = {config: data.space}
						// console.log(data)
						init();
					}
				}
			})();
			
			function initView() {
				var all = document.all;
				for (var i = 0, len = all.length; i < len; i++) {
					if (all[i].id) {
						view[all[i].id] = all[i];
					}
				}
				view.allStep.innerHTML = data.step.length - data.box.length - data.pallet.length;
			}
			
			function initViews() {
				views = [
						{ // 主视角
							left: 0,
							bottom: 0,
							width: 1,
							height: 1
						},
						{ // 正视图
							rightMargin: 1,
							bottomMargin: 0,
							width: config.threeView.width,
							height: config.threeView.height,
							eye: [
									config.cube.x * -1, 
									config.cube.y * (data.config.space.height + data.config.space.floorHeight) / 2, 
									config.cube.z * data.config.space.depth / 2
								],
							viewport: [
									Math.max(config.cube.y * (data.config.space.height + data.config.space.floorHeight), config.cube.z * data.config.space.depth) / -2, 
									Math.max(config.cube.y * (data.config.space.height + data.config.space.floorHeight), config.cube.z * data.config.space.depth) / 2, 
									Math.max(config.cube.y * (data.config.space.height + data.config.space.floorHeight), config.cube.z * data.config.space.depth) / 2, 
									Math.max(config.cube.y * (data.config.space.height + data.config.space.floorHeight), config.cube.z * data.config.space.depth) / -2
								],
							lookAt: [
									config.cube.x * data.config.space.width, 
									config.cube.y * (data.config.space.height + data.config.space.floorHeight) / 2, 
									config.cube.z * data.config.space.depth / 2
								]
						},
						{ // 左视图
							rightMargin: 2,
							bottomMargin: 0,
							width: config.threeView.width,
							height: config.threeView.height,
							eye: [
									config.cube.x * data.config.space.width / 2, 
									config.cube.y * (data.config.space.height + data.config.space.floorHeight) / 2, 
									config.cube.z * -1
								],
							viewport: [
									Math.max(config.cube.x * data.config.space.width, config.cube.y * (data.config.space.height + data.config.space.floorHeight)) / -2, 
									Math.max(config.cube.x * data.config.space.width, config.cube.y * (data.config.space.height + data.config.space.floorHeight)) / 2, 
									Math.max(config.cube.x * data.config.space.width, config.cube.y * (data.config.space.height + data.config.space.floorHeight)) / 2, 
									Math.max(config.cube.x * data.config.space.width, config.cube.y * (data.config.space.height + data.config.space.floorHeight)) / -2
								],
							lookAt: [
									config.cube.x * data.config.space.width / 2, 
									config.cube.y * (data.config.space.height + data.config.space.floorHeight) / 2, 
									config.cube.z * data.config.space.depth
								]
						},
						{ // 顶视图
							rightMargin: 1,
							bottomMargin: 1,
							width: config.threeView.width,
							height: config.threeView.height,
							eye: [
									config.cube.x * data.config.space.width / 2, 
									config.cube.y * (data.config.space.height + data.config.space.floorHeight + 1) , 
									config.cube.z * data.config.space.depth / 2
								],
							viewport: [
									Math.max(config.cube.x * data.config.space.width, config.cube.z * data.config.space.depth) / 2, 
									Math.max(config.cube.x * data.config.space.width, config.cube.z * data.config.space.depth) / -2, 
									Math.max(config.cube.x * data.config.space.width, config.cube.z * data.config.space.depth) / -2, 
									Math.max(config.cube.x * data.config.space.width, config.cube.z * data.config.space.depth) / 2
								],
							lookAt: [
									config.cube.x * data.config.space.width / 2, 
									config.cube.y * data.config.space.floorHeight, 
									config.cube.z * data.config.space.depth / 2
								]
						}
					];
				
				config.standardSize = config.cube.x * data.config.space.width + config.cube.y * data.config.space.height + config.cube.z * data.config.space.depth / 3;
				for (var i =  views.length - 1; i >= 0; i--) {
					var v = views[i], c;
					var range =  Math.max(config.cube.x * data.config.space.width, config.cube.y * data.config.space.height, config.cube.z * data.config.space.depth) * 10;
					if (i !== 0) {
						c = new THREE.OrthographicCamera(v.viewport[0], v.viewport[1], v.viewport[2], v.viewport[3] , 1, range);
						c.position.set(v.eye[0], v.eye[1], v.eye[2]);
						c.lookAt(new THREE.Vector3(v.lookAt[0], v.lookAt[1], v.lookAt[2]));
						v.camera = c;
					} else {
						camera = new THREE.PerspectiveCamera(75, config.innerWidth / config.innerHeight, 1, range);
						v.camera = camera;
					}
				}
			}
			
			function initScene() {
				scene = new THREE.Scene();
				scene.fog = new THREE.Fog( 0xffffff, 0, Math.max(config.cube.x * data.config.space.width, config.cube.y * data.config.space.height, config.cube.z * data.config.space.depth) * 3);
			}
			
			function initLight() {
				var light = new THREE.HemisphereLight( 0xeeeeee, 0x777777, 0.8 );
				light.position.set(config.cube.x * data.config.space.width / 2 , config.cube.y * (data.config.space.height + data.config.space.floorHeight + 10), config.cube.z * data.config.space.depth / 2 );
				scene.add( light );
			}
			
			function initControls() {
				controls = new THREE.PointerLockControls(camera, config.cube.x * data.config.space.width, config.cube.y * data.config.space.height, config.cube.z * data.config.space.depth, config.cube.y * data.config.space.floorHeight);
				scene.add( controls.getObject() );
				raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
			}
			
			function initGround() {
				var imageCanvas = document.createElement( "canvas" ),
					context = imageCanvas.getContext( "2d" );

				imageCanvas.width = imageCanvas.height = 128;
				context.fillStyle = "#000";
				context.fillRect(0, 0, 128, 128);
				context.fillStyle = "#fff";
				context.fillRect(0, 0, 64, 64);
				context.fillRect(64, 64, 64, 64);
				var textureCanvas = new THREE.Texture( imageCanvas, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping ),
					materialCanvas = new THREE.MeshBasicMaterial( { map: textureCanvas } );

				textureCanvas.needsUpdate = true;
				textureCanvas.repeat.set(Math.max(data.config.space.width, data.config.space.depth) * 1000 / config.standardSize, Math.max(data.config.space.width, data.config.space.depth) * 1000 / config.standardSize);
				geometry = new THREE.PlaneGeometry(Math.max(data.config.space.width, data.config.space.depth) * 10 * config.cube.x, Math.max(data.config.space.width, data.config.space.depth) * 10 * config.cube.z);
				mesh = new THREE.Mesh( geometry, materialCanvas );
				mesh.rotation.x = 3 * Math.PI / 2;
				scene.add( mesh );
			}
			
			function initFloor() {
				geometry = new THREE.BoxGeometry( data.config.space.width * config.cube.x, data.config.space.floorHeight * config.cube.y, data.config.space.depth * config.cube.z);
				for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {
					var face = geometry.faces[ i ];
					face.vertexColors[ 0 ] = new THREE.Color().setHSL( 0.5, 0.75,  0.75 );
					face.vertexColors[ 1 ] = new THREE.Color().setHSL( 0.5, 0.75,  0.75 );
					face.vertexColors[ 2 ] = new THREE.Color().setHSL( 0.5, 0.75, 0.75 );
				}
				material = new THREE.MeshPhongMaterial( { shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );

				var mesh = new THREE.Mesh( geometry, material );
				mesh.position.x = data.config.space.width * config.cube.x / 2;
				mesh.position.y = data.config.space.floorHeight * config.cube.y / 2;
				mesh.position.z = data.config.space.depth * config.cube.z / 2;
				scene.add( mesh );
			}
			
			function initSpace() {
				geometry = new THREE.BoxGeometry( data.config.space.width * (config.cube.x + 0.02), data.config.space.height * (config.cube.y + 0.02), data.config.space.depth * (config.cube.z + 0.02));
				material = new THREE.MeshBasicMaterial({color: 0x000000, transparent:true, opacity: 0.25, side: THREE.FrontSide});

				var mesh = new THREE.Mesh( geometry, material );
				mesh.position.x = data.config.space.width * config.cube.x / 2;
				mesh.position.y = data.config.space.floorHeight * config.cube.y + data.config.space.height * config.cube.y / 2;
				mesh.position.z = data.config.space.depth * config.cube.z / 2;
				scene.add( mesh );
			}
			
			function initObjects() {
				status.sceneExceptBoxLength = scene.children.length;
				
				// 初始化货物数据
				for ( var i = 0; i < data.box.length; i++ ) {
					var box = data.box[i];
					material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
					geometry = new THREE.BoxGeometry( config.cube.x * box.width, config.cube.y * box.height, config.cube.z * box.depth);
					for ( var j = 0, l = geometry.faces.length; j < l; j++) {
						var face = geometry.faces[ j ];
						face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.5 + 0.5, 0.5, Math.random() * 0.25 + 0.75 );
						face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.5 + 0.5, 0.5, Math.random() * 0.25 + 0.75 );
						face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.5 + 0.5, 0.5, Math.random() * 0.25 + 0.75 );
						// new THREE.Color("rgb(255,0,0)");

					}
					
					var mesh = new THREE.Mesh( geometry, material );
					mesh.boxId = box.id;
					mesh.boxSize = box.width * box.height * box.depth;
					
					// 获取货品的初始位置
					for (var j = 0; j < data.step.length; j++) {
						if (data.step[j].id === box.id) {
							mesh.position.x = config.cube.x * box.width / 2 + data.step[j].moveTo.x * config.cube.x;
							mesh.position.y = config.cube.y * box.height / 2 + data.config.space.floorHeight * config.cube.y + data.step[j].moveTo.y * config.cube.y;
							mesh.position.z = config.cube.z * box.depth / 2 + data.step[j].moveTo.z * config.cube.z;
							break;
						}
					}
					
					mesh.visible = false;
					scene.add( mesh );
					objects.push( mesh );
				}
				
				// 初始化托盘数据
				for ( var i = 0; i < data.pallet.length; i++ ) {
					var pallet = data.pallet[i];
					material = new THREE.MeshPhongMaterial( { specular: 0x000000, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
					geometry = new THREE.BoxGeometry( config.cube.x * pallet.width, config.cube.y * pallet.height, config.cube.z * pallet.depth);
					for ( var j = 0, l = geometry.faces.length; j < l; j++) {
						var face = geometry.faces[ j ];
						face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.5 + 0.0, 0.1, Math.random() * 0.25 + 0.15 );
						face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.5 + 0.0, 0.1, Math.random() * 0.25 + 0.15 );
						face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.5 + 0.0, 0.1, Math.random() * 0.25 + 0.15 );
						// new THREE.Color("rgb(255,0,0)");

					}
					
					var mesh = new THREE.Mesh( geometry, material );
					mesh.palletId = pallet.id;
					mesh.palletSize = pallet.width * pallet.height * pallet.depth;
					
					// 获取货品的初始位置
					for (var j = 0; j < data.step.length; j++) {
						if (data.step[j].pid === pallet.id) {
								// console.log(j, data.step[j]);
							mesh.position.x = config.cube.x * pallet.width / 2 + data.step[j].moveTo.x * config.cube.x;
							mesh.position.y = config.cube.y * pallet.height / 2 + data.config.space.floorHeight * config.cube.y + data.step[j].moveTo.y * config.cube.y;
							mesh.position.z = config.cube.z * pallet.depth / 2 + data.step[j].moveTo.z * config.cube.z;
							break;
						}
					}
					
					mesh.visible = false;
					scene.add( mesh );
					objects.push( mesh );
				}
				
			}
			
			function initRenderer() {
				renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize(config.innerWidth, config.innerHeight);
				renderer.setClearColor(0xffffff, 1);
				document.body.appendChild( renderer.domElement );
			}
			
			function init() {
				
				// 初始化dom
				initView();
				
				// 初始化照相机
				initViews();
				
				// 初始化场景
				initScene();
				
				// 初始化灯光
				initLight();
				
				// 初始化操作
				initControls();
			
				// 初始化地面
				initGround();
				
				// 初始化floor
				initFloor();
				
				// 初始化空间
				initSpace();
				
				// 初始化货物
				initObjects();
				
				// 初始化渲染器
				initRenderer();
				
				// 绑定事件
				bindEvents();
				
				// 执行动画
				animate();
			}
			
			function animate() {

				if ( controlsEnabled ) {
					raycaster.ray.origin.copy( controls.getObject().position );

					var time = performance.now(),
						delta = ( time - prevTime ) / 1000,
						flySpeed = config.flySpeed * status.flySpeedRadio * config.standardSize / 400;

					velocity.x -= velocity.x * 10.0 * delta;
					velocity.z -= velocity.z * 10.0 * delta;
					velocity.y -= velocity.y * 10.0 * delta;

					if ( moveForward ) velocity.z -= flySpeed * delta;
					if ( moveBackward ) velocity.z += flySpeed * delta;

					if ( moveLeft ) velocity.x -= flySpeed * delta;
					if ( moveRight ) velocity.x += flySpeed * delta;
					
					if ( moveUp ) velocity.y += flySpeed * delta;
					if ( moveDown ) {
						if (raycaster.ray.origin.y - flySpeed * delta > 0)	{
							velocity.y -= flySpeed * delta;
						} else {
							raycaster.ray.origin.y = 0;
						}
					}

					controls.getObject().translateX( velocity.x * delta );
					controls.getObject().translateY( velocity.y * delta );
					controls.getObject().translateZ( velocity.z * delta );
					
					// 货品动画
					if (status.play) {
						var step = data.step,
							objectsSpeed = config.objectsSpeed * status.objectsSpeedRadio / 100 * config.standardSize / 400;
							
						status.playOver = false;
						for (var i = 0; i < step.length; i++) {
							if (! step[i].played) {
								
								// 托盘相关
								if (step[i].pid) {
									var pid = step[i].pid,
									mesh = getPalletMesh(pid);
									mesh.visible = true;
									
									// 第二次遇到
									if (status.pallet.id) {
										var isMove = false;
										for (var k in step[i].moveTo) {
											if (step[i].moveTo[k] < step[status.pallet.stepIndex].moveTo[k]) {
												if (step[i].moveTo[k] + objectsSpeed > step[status.pallet.stepIndex].moveTo[k]) {
													objectsSpeed = step[status.pallet.stepIndex].moveTo[k] - step[i].moveTo[k];
												}
												step[status.pallet.stepIndex].moveTo[k] -= objectsSpeed;
												mesh.position[k] -= objectsSpeed * config.cube[k];
												for (var j = 0; j < status.pallet.boxList.length; j++) {
													var box = getMesh(status.pallet.boxList[j]);
													box.position[k] -= objectsSpeed * config.cube[k];
												}
												isMove = true;
											} else if (step[i].moveTo[k] > step[status.pallet.stepIndex].moveTo[k] ) {
												if (step[i].moveTo[k] - objectsSpeed < step[status.pallet.stepIndex].moveTo[k]) {
													objectsSpeed = step[i].moveTo[k] - step[status.pallet.stepIndex].moveTo[k];
												}
												step[status.pallet.stepIndex].moveTo[k] += objectsSpeed;
												mesh.position[k] += objectsSpeed * config.cube[k];
												for (var j = 0; j < status.pallet.boxList.length; j++) {
													var box = getMesh(status.pallet.boxList[j]);
													box.position[k] += objectsSpeed * config.cube[k];
												}
												isMove = true;
											}
										}
										if (! isMove) {
											if (i < step.length - 2) {
												view.nowStep.innerHTML++;
											}
											
											status.pallet.id = 0;
											status.pallet.stepIndex = 0;
											status.pallet.boxList.length = 0;
											step[i].played = true;
											
										}
									} else {
										
										status.pallet.id = pid;
										status.pallet.stepIndex = i;
										step[i].played =  true;
										continue;
									}
									
									break;
									
								} else if ((i < step.length - 1) && step[i].id) {
									var id = step[i].id,
										mesh = getMesh(id);
									view.nowBoxId.innerHTML = id;
									mesh.visible = true;
									var box = data.box[step[i].id - 1];
									if (! box.cal) {
										status.spaceUsed += box.width * box.height * box.depth;
										var radio = status.spaceUsed / (data.config.space.width * data.config.space.height * data.config.space.depth) * 100;
										view.spaceUsed.innerHTML = radio.toFixed(2) + '%';
										box.cal = true;
									}
									// 这是一个连续动作
									if (step[i + 1].id == id) {
										var isMove = false;
										
										for (var k in step[i].moveTo) {
											if (step[i].moveTo[k] < step[i + 1].moveTo[k]) {
												if (step[i].moveTo[k] + objectsSpeed > step[i + 1].moveTo[k]) {
													objectsSpeed = step[i + 1].moveTo[k] - step[i].moveTo[k];
												}
												step[i].moveTo[k] += objectsSpeed;
												mesh.position[k] += objectsSpeed * config.cube[k];
												isMove = true;
											} else if (step[i].moveTo[k] > step[i + 1].moveTo[k] ) {
												if (step[i].moveTo[k] - objectsSpeed < step[i + 1].moveTo[k]) {
													objectsSpeed = step[i].moveTo[k] - step[i + 1].moveTo[k];
												}
												step[i].moveTo[k] -= objectsSpeed;
												mesh.position[k] -= objectsSpeed * config.cube[k];
												isMove = true;
											}
										}
										if (! isMove) {
											if (i < step.length - 2) {
												view.nowStep.innerHTML++;
											}
											step[i].played = true;
											
											if (status.pallet.id) {
												status.pallet.boxList.push(id);
											}
										}
									} else { // 更换到下一个货品了
										step[i].played = true;
										continue;
									}
									
									
									break;
								
								
								}
								
							}
						}
						if (i == step.length) {
							status.playOver = true;
						}
					}
					
					prevTime = time;

				}
				
				// 视图渲染
				for (var i = 0; i < views.length; i++) {
					var v = views[i],
						c = v.camera,
						margin, left, bottom, width, height;
					
					if (i == 0) {
						width = config.innerWidth * v.width;
						height = config.innerHeight * v.height;
						left = config.innerWidth * v.left;
						bottom = config.innerHeight * v.bottom;
					} else {
						margin = config.innerMin * config.threeView.margin;
						width = config.innerMin * v.width;
						height = config.innerMin * v.height;
						left = config.innerWidth - width * v.rightMargin - margin * v.rightMargin;
						bottom = height * v.bottomMargin + margin * (v.bottomMargin + 1);
					}
					
					renderer.setViewport(left, bottom, width, height);
					renderer.setScissor(left, bottom, width, height);
					renderer.enableScissorTest(true);
					renderer.render(scene, c);
				}
				
				requestAnimationFrame(animate);
			}
			
			function getMesh(id) {
				for (var i = 0; i < objects.length; i++) {
					if (objects[i].boxId == id) {
						return objects[i];
					}
				}
				
				return false;
			}
			
			function getPalletMesh(id) {
				for (var i = 0; i < objects.length; i++) {
					if (objects[i].palletId == id) {
						return objects[i];
					}
				}
				
				return false;
			}
			
			function checkBrowser() {
				// 隐藏鼠标
				if ('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document) {
				} else {
					alert('Your browser doesn\'t seem to support Pointer Lock API');
				}
			}
			function bindEvents() {
				// 隐藏鼠标
				if ('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document) {
					var element = document.body;
					var pointerlockchange = function ( event ) {

						if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
							controlsEnabled = true;
							controls.enabled = true;
							status.play = true;
							view.blocker.style.display = 'none';
						} else {
							controlsEnabled = false;
							controls.enabled = false;
							status.play = false;
							view.blocker.style.display = '-webkit-box';
							view.blocker.style.display = '-moz-box';
							view.blocker.style.display = 'box';
							view.instructions.style.display = '';
						}
					}

					var pointerlockerror = function ( event ) {
						view.instructions.style.display = '';
					}
					document.addEventListener( 'pointerlockchange', pointerlockchange, false );
					document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
					document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

					document.addEventListener( 'pointerlockerror', pointerlockerror, false );
					document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
					document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

					view.continue.addEventListener( 'click', function ( event ) {
						view.instructions.style.display = 'none';

						// Ask the browser to lock the pointer
						element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

						if ( /Firefox/i.test( navigator.userAgent ) ) {

							var fullscreenchange = function ( event ) {

								if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

									document.removeEventListener( 'fullscreenchange', fullscreenchange );
									document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

									element.requestPointerLock();
								}

							}

							document.addEventListener( 'fullscreenchange', fullscreenchange, false );
							document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
							element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
							element.requestFullscreen();
						} else {
							element.requestPointerLock();
						}
					}, false );
				} else {
					view.instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
				}
				
				document.addEventListener( 'keydown', function ( event ) {
					if (controlsEnabled) {
						triggerKey(event.keyCode, true);
					}
				}, false );
				
				document.addEventListener( 'keyup', function ( event ) {
					if (controlsEnabled) {
						triggerKey(event.keyCode, false);
					}
				}, false );
				
				function triggerKey(keyCode, value) {
					switch (keyCode) {
						case 38: // up
						case 87: // w
							moveForward = value;
							break;

						case 37: // left
						case 65: // a
							moveLeft = value; 
							break;
							
						case 40: // down
						case 83: // s
							moveBackward = value;
							break;

						case 39: // right
						case 68: // d
							moveRight = value;
							break;

						case 33: // up
							moveUp = value;
							break;
							
						case 34: // up
							moveDown = value;
							break;
						
						case 32: // space
							moveUp = value;
							break;
							
						case 82: // r
							if (! value) {
								if (status.playOver) {
									restart();
								} else {
									status.play = ! status.play;
								}
							}
							break;

						case 84: // t
							if (! value) {
								restart();
							}
							break;
					}
					
					function restart() {
						data = JSON.parse(backJSON);
						objects.length = 0;
						scene.children.length = status.sceneExceptBoxLength;
						initObjects();
						view.nowStep.innerHTML = 1;
						status.play = true;
						status.spaceUsed = 0;
					}
				}
				
				document.addEventListener( 'mousedown', function(event){
					if (controlsEnabled) {
						triggerMouse(event.which, true);
					}
				}, false );
				
				document.addEventListener( 'mouseup', function(event){
					if (controlsEnabled) {
						triggerMouse(event.which, false);
					}
				}, false );
				
				function triggerMouse(which, value) {
					switch (which) {
						case 1:
							moveUp = value;
							break;
							
						case 3: 
							moveDown = value;
							break;
					}
				}
				

				view.flySpeedRadio.oninput = function(){
					view.flySpeedRadioSpan.innerHTML = status.flySpeedRadio = this.value;
				};
				
				view.objectsSpeedRadio.oninput = function(){
					view.objectsSpeedRadioSpan.innerHTML = status.objectsSpeedRadio = this.value;
				};
				
				window.addEventListener( 'resize', onWindowResize, false );
				
				function onWindowResize() {
					config.innerWidth = window.innerWidth;
					config.innerHeight = window.innerHeight;
					config.innerMin = Math.min(window.innerWidth, window.innerHeight);
					
					camera.aspect = config.innerWidth / config.innerHeight;
					camera.updateProjectionMatrix();

					renderer.setSize( config.innerWidth, config.innerHeight );
				}
			}
};