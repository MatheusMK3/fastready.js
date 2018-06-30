const gulp = require('gulp');
const minify = require('gulp-minify');

gulp.task('default', function() {
  gulp.src('lib/*.js')
    .pipe(minify({
        ext:{
            src:'.js',
            min:'.min.js'
        },
        exclude: ['tasks'],
        ignoreFiles: ['.combo.js', '-min.js']
    }))
    .pipe(gulp.dest('dist'))
});