var gulp = require("gulp");
var batch = require('gulp-batch');
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var less = require("gulp-less");
var sequence = require("run-sequence");

// Concat JavaScript files in src
gulp.task("concat-libraries", function () {
    return gulp.src(["./src/js/libraries/*.js"])
      .pipe(concat("libraries.js"))
      .pipe(gulp.dest("./dist/js/"));
});

gulp.task("concat-internal", function () {
    return gulp.src(["./src/js/internal/*.js"])
      .pipe(concat("internal.js"))
      .pipe(gulp.dest("./dist/js/"));
});

gulp.task("concat-angular-pages", function () {
    return gulp.src(["./app/pages/**/*.js"])
      .pipe(concat("pages.js"))
      .pipe(gulp.dest("./dist/js/"));
});

gulp.task("concat-angular-app", function () {
    return gulp.src(["./app/app.js"])
      .pipe(concat("app.js"))
      .pipe(gulp.dest("./dist/js/"));
});

gulp.task("concat-angular-shared", function () {
    return gulp.src(["./app/shared/*.js"])
      .pipe(concat("app-shared.js"))
      .pipe(gulp.dest("./dist/js/"));
});

gulp.task("concat-css-libraries", function () {
    return gulp.src(["./src/css/libraries/*.css"])
      .pipe(concat("libraries.css"))
      .pipe(gulp.dest("./dist/css/"));
});

gulp.task("copy-fonts", function () {
    return gulp.src(["./src/fonts/**"])
      .pipe(gulp.dest("./fonts"));
});

gulp.task('less-base', function () {
    return gulp.src('./src/css/less/base/base.less')
      .pipe(less({
          paths: [__dirname]
      }))
      .pipe(gulp.dest('./dist/css'));
});

gulp.task("compress", function () {
    return gulp.src(["./dist/js/*.js", "!./dist/js/*.min.js"])
    .pipe(uglify())
     .pipe(rename({
        extname: ".min.js"
    }))
    .pipe(gulp.dest("./dist/js/"));
});

gulp.task('dist', function (done) {
    sequence('concat-libraries', 'concat-internal', 'concat-angular-pages', 'concat-angular-app', 'concat-angular-shared', 'less-base', 'concat-css-libraries', 'compress', 'copy-fonts', function () {
        done();
    });
});