// var syntax        = 'sass'; // Syntax: sass or scss;
var gulp          			= require('gulp'),
	gutil         			= require('gulp-util' ),
	sass          			= require('gulp-sass'),
	browserSync   			= require('browser-sync'),
	concat        			= require('gulp-concat'),
	uglify        			= require('gulp-uglify'),
	cleancss      			= require('gulp-clean-css'),
	rename        			= require('gulp-rename'),
	autoprefixer  			= require('gulp-autoprefixer'),
	notify       			= require("gulp-notify"),
	sourcemaps 	  			= require('gulp-sourcemaps'),
	cache        			= require('gulp-cache'),
	imagemin 	  			= require('gulp-imagemin'),
	imageminPngquant 		= require('imagemin-pngquant'),
	imageminJpegRecompress  = require('imagemin-jpeg-recompress'),
	rsync         = require('gulp-rsync');
	//add sprite
	svgSprite               = require('gulp-svg-sprites'),
	  svgmin                  = require('gulp-svgmin'),
	  cheerio                 = require('gulp-cheerio'),
	  replace                 = require('gulp-replace');



gulp.task('browser-sync', function() {
	browserSync.init({
		proxy: "gulpsp/dist",
		notify: false
		// open: false,
		// online: false, // Work Offline Without Internet Connection
		// tunnel: true, tunnel: "projectname", // Demonstration page: http://projectname.localtunnel.me
	})
	// gulp.watch('dist/*.php').on('change', browserSync.reload);
});

gulp.task('sass', function() {
	// return gulp.src('src/'+syntax+'/**/*.'+syntax+'')
	return gulp.src(['src/sass/*.sass', 'src/sass/**/*.scss'])
	
	.pipe ( sourcemaps . init ( ) )
	.pipe(sass({ outputStyle: 'expanded' }).on("error", notify.onError()))
	.pipe(rename({ suffix: '.min', prefix : '' }))
	.pipe(autoprefixer(['last 15 versions']))
	.pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Opt., comment out when debugging
	.pipe ( sourcemaps . write ('.'))

	.pipe(gulp.dest('dist/css'))
	.pipe(browserSync.stream())
});


// svg sprite
gulp.task('svgSpriteBuild', function () {
  return gulp.src('src/icons/*.svg')
    // minify svg
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    // remove all fill and style declarations in out shapes
    .pipe(cheerio({
      run: function ($) {
        $('[fill^="#"]').removeAttr('fill');
        $('[style]').removeAttr('style');
      },
      parserOptions: {
        xmlMode: true
      }
    }))
    // cheerio plugin create unnecessary string '>', so replace it.
    .pipe(replace('&gt;', '>'))
    // build svg sprite
    .pipe(svgSprite({
      mode: "symbols",
      preview: false,
      selector: "icon-%f",
      svg: {
        symbols: 'symbol_sprite.php'
      }
    }))
    .pipe(gulp.dest('dist/icons'));
});

// Сжатие картинок
gulp.task('compress', function(){
    return gulp.src('src/img/**/*')
        .pipe(cache(imagemin([
              imagemin.gifsicle({interlaced: true}),
              imagemin.jpegtran({progressive: true}),
              imageminJpegRecompress({
                loops: 5,
                min: 65,
                max: 70,
                quality:'medium'
              }),
              imagemin.svgo(),
              imagemin.optipng({optimizationLevel: 5}),
              imageminPngquant({quality: '55-60', speed: 5})
            ],{
              verbose: true
        })))
        .pipe(gulp.dest('dist/img'));
});

// Очистка кэша
gulp.task('clear', function () {
    return cache.clearAll();
})

gulp.task('js', function() {
	return gulp.src([
		// 'src/js/libs/ion.rangeSlider.js',
		'src/js/common.js', // Always at the end
		])
	.pipe(concat('scripts.min.js'))
	// .pipe(uglify()) // Mifify js (opt.)
	.pipe(gulp.dest('dist/js'))
	.pipe(browserSync.reload({ stream: true }))
});

// Деплой на FTP
// gulp.task('rsync', function() {
// 	return gulp.src('app/**')
// 	.pipe(rsync({
// 		root: 'app/',
// 		hostname: 'username@yousite.com',
// 		destination: 'yousite/public_html/',
// 		// include: ['*.htaccess'], // Includes files to deploy
// 		exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
// 		recursive: true,
// 		archive: true,
// 		silent: false,
// 		compress: true
// 	}))
// });

// Отслеживание файлов
gulp.task('watch', ['sass', 'js', 'browser-sync', 'compress', 'svgSpriteBuild'], function() {
	// gulp.watch('src/'+syntax+'/**/*.'+syntax+'', ['styles']);
	gulp.watch(['src/sass/**/*.sass', 'src/sass/**/*.scss'], ['sass']);
	gulp.watch('src/img/*', ['compress']);
	gulp.watch('src/icons/**/*', ['svgSpriteBuild']);
	gulp.watch(['src/libs/**/*.js', 'src/js/common.js'], ['js']);
	// gulp.watch('dist/*.html', browserSync.reload);
	gulp.watch('dist/*.php', browserSync.reload)
});

gulp.task('default', ['watch']);
