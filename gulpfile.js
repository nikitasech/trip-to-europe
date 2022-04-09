const gulp = require('gulp');
const del = require('del');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sourcemap = require('gulp-sourcemaps');
const posthtml = require('gulp-posthtml');
const include = require('posthtml-include');
const htmlmin = require('gulp-htmlmin');

const sass = require('gulp-sass')(require('sass'));
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const csso = require('gulp-csso');
const csscomb = require('gulp-csscomb');

const webp = require('gulp-webp');
const imagemin = require('gulp-imagemin');
const svgstore = require('gulp-svgstore');

const clean = () => {
  return del('build');
}

const copy = () => {
  return gulp.src([
    './source/fonts/**',
    './source/*.ico'
  ], {
    base: 'source',
  })
  .pipe(gulp.dest('./build'));
}

const svg = () => {
  return gulp.src('./source/img/**/*.svg')
  .pipe(imagemin([
    imagemin.svgo({
      plugins: [
        {convertStyleToAttrs: true},
        {sortAttrs: true}
      ]
    })
  ]))
  .pipe(gulp.dest('./build/img'));
}

const img = () => {
  return gulp.src('./source/img/**/*.{png,jpg}')
  .pipe(imagemin([
    imagemin.optipng({optimizationLevel: 5}),
    imagemin.mozjpeg({progressive: true})
  ]))
  .pipe(webp({quality: 85}))
  .pipe(gulp.dest('./build/img/'));
}

const sprite = () => {
  return gulp.src('./build/img/**/icon-*.svg')
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('./build/img'))
};

const html = () => {
  return gulp.src('source/*.html')
  .pipe(posthtml([
    include()
  ]))
  .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(gulp.dest('./build/'));
}

const css = () => {
  return gulp.src('./source/sass/style.scss')
  .pipe(plumber({
    errorHandler: function(err) {
      console.log(err);
      this.emit('end');
    }
  }))
  .pipe(sourcemap.init())
  .pipe(sass())
  .pipe(postcss([
    autoprefixer()
  ]))
  .pipe(csso())
  .pipe(rename('style.min.css'))
  .pipe(sourcemap.write('.'))
  .pipe(gulp.dest('build/css/'));
}

const cssComb = () => {
  return gulp.src('source/sass/**/*.scss')
    .pipe(csscomb())
    .pipe(gulp.dest('source/sass/.'));
}

const js = () => {
  return gulp.src('source/js/**/*.js')
  .pipe(concat('bundle.min.js'))
  .pipe(sourcemap.init())
  .pipe(uglify())
  .pipe(sourcemap.write(''))
  .pipe(gulp.dest('./build/js/'));
}

const server = () => {
  browserSync.init({
    server: './build/',
    notify: false,
    open: false,
    cors: true,
    ui: false
  })

  gulp.watch('./source/*.html', html).on('change', browserSync.reload);
  gulp.watch('./source/sass/**/*.scss', css).on('change', browserSync.reload);
  gulp.watch('./source/js/**/*.js', js).on('change', browserSync.reload);
  gulp.watch(['./source/img/**/*.svg', '!./source/img/**/icon-*.svg'], svg).on('change', browserSync.reload);
  gulp.watch('./source/img/**/icon-*.svg', gulp.series(svg, sprite, html)).on('change', browserSync.reload);
}

const build = gulp.series(clean, copy, img, svg, sprite, html, css, js);

exports.csscomb = cssComb;
exports.build = build;
exports.start = gulp.series(build, server);
