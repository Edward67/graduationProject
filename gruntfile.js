module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */',
		
		uglify: {
			"all": {
				"files": {
					"asset/js/all.min.js": ['src/js/three.min.js', 'src/js/PointerLockControls.js', 'src/js/script.js']
				}
			}
		}
	});
	
	// grunt.loadNpmTasks('grunt-contrib-smartsprites');
	// grunt.loadNpmTasks('grunt-contrib-concat');
	// grunt.loadNpmTasks('grunt-css');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['uglify']);

};