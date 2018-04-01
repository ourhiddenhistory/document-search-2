const gulp = require('gulp');
const concat = require('gulp-concat');
const sass = require('gulp-sass');
const babel = require('gulp-babel');
const child = require('child_process');
const gutil = require('gulp-util');

const scssFiles = 'src/sass/**/*.scss';
const jsFiles = 'src/js/**/*.js';
const dataFiles = '_data/**/*.json';

gulp.task('css', () => {
  gulp.src(scssFiles)
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('style.css'))
    .pipe(gulp.dest('dist'))
});

gulp.task('js', () =>
  gulp.src(jsFiles)
    .pipe(concat('index.js'))
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(gulp.dest('dist'))
);

gulp.task('jekyll', () => {
  const jekyll = child.spawn('jekyll', ['build', 'serve',
    '--watch',
    '--incremental',
    '--drafts'
  ]);

  const jekyllLogger = (buffer) => {
    buffer.toString()
      .split(/\n/)
      .forEach((message) => gutil.log('Jekyll: ' + message));
  };

  jekyll.stdout.on('data', jekyllLogger);
  jekyll.stderr.on('data', jekyllLogger);
});

gulp.task('watch', () => {
  gulp.watch(scssFiles, ['css', 'jekyll', 'watch']);
  gulp.watch(jsFiles, ['js', 'jekyll', 'watch']);
  gulp.watch(dataFiles, ['jekyll', 'watch']);
});

gulp.task('default', ['css', 'js', 'jekyll', 'watch']);
