var gulp = require('gulp');
var babel = require('gulp-babel');
var nodemon = require('gulp-nodemon');
var jshint = require('gulp-jshint');
var Cache = require('gulp-file-cache');

var path = require('path');

var cache = new Cache();

var paths = {
    src: ['src/**/*.js'],
    app: 'app'
};
gulp.task('compile', function () {
    return gulp.src(paths.src)
        .pipe(cache.filter())
        .pipe(babel())
        .pipe(cache.cache())
        .pipe(gulp.dest(paths.app));
});

gulp.task('lint', function () {
    gulp.src('src/**/*.js').pipe(jshint());
});

gulp.task('watch', ['lint', 'compile'], function () {
   return nodemon({
        script: 'app/bin/www', // run ES5 code
        watch: 'src', // watch ES2015 code
        tasks: ['lint', 'compile'] // compile synchronously onChange
    });
});