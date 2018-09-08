const gulp = require('gulp');
const concat = require('gulp-concat');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const child = require('child_process');
const gutil = require('gulp-util');
const rename = require('gulp-rename');
const run = require('gulp-run');

const scssFiles = 'src/sass/**/*.scss';
const jsFiles = 'src/js/**/*.js';
const dataFiles = '_data/**/*.json';

// use gulp-run to start a pipeline
gulp.task('buildDataFile', () => {
  return run('npm run buildDataFile').exec();
})

gulp.task('css', () => {
  gulp.src(scssFiles)
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('style.css'))
    .pipe(autoprefixer({
      browsers: ['last 8 versions'],
      cascade: false,
    }))
    .pipe(cssnano())
    .pipe(gulp.dest('dist'));
});

gulp.task('js', () =>
  gulp.src(jsFiles)
    .pipe(concat('index.js'))
    .pipe(babel({
      presets: ['env'],
    }))
    .pipe(uglify())
    .pipe(gulp.dest('dist')));

gulp.task('copy', () =>
  gulp.src(['node_modules/requirejs/require.js', 'node_modules/elasticsearch-browser/elasticsearch.jquery.js'])
    .pipe(gulp.dest('dist')));

gulp.task('copyImgs', () =>
  gulp.src(['src/img/**/*'])
    .pipe(gulp.dest('dist/img')));

gulp.task('copyHtaccessDev', () =>
  gulp.src(['.htaccess.dev'])
    .pipe(rename('.htaccess'))
    .pipe(gulp.dest('dist')));

gulp.task('jekyll', () => {
  const jekyll = child.spawn('jekyll', ['serve',
    '--config',
    '_config.dev.yml',
    '--watch',
    '--incremental',
    '--drafts',
  ]);

  const jekyllLogger = (buffer) => {
    buffer.toString()
      .split(/\n/)
      .forEach(message => gutil.log(`Jekyll: ${message}`));
  };

  jekyll.stdout.on('data', jekyllLogger);
  jekyll.stderr.on('data', jekyllLogger);
});

gulp.task('watch', () => {
  gulp.watch(scssFiles, ['css', 'jekyll']);
  gulp.watch(jsFiles, ['js', 'jekyll']);
  gulp.watch(dataFiles, ['jekyll']);
});

gulp.task('default', ['buildDataFile', 'copy', 'copyImgs', 'copyHtaccessDev', 'css', 'js', 'jekyll', 'watch']);
gulp.task('build', ['buildDataFile', 'copy', 'css', 'js']);
