var gulp = require("gulp");
var batch = require('gulp-batch');
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var less = require("gulp-less");
var sequence = require("run-sequence");

gulp.task("concat-files", function () {
    return gulp.src(["./app/shared/*.js", "./src/js/libraries/*.js", "./src/js/internal/*.js"])
      .pipe(concat("admin-kit.js"))
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

gulp.task("concat-ui", function () {
    return gulp.src(["./src/js/ui/*.js"])
      .pipe(concat("ui.js"))
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
    sequence('concat-files', 'concat-angular-pages', 'concat-angular-app', 'concat-ui', 'concat-css-libraries', 'less-base', 'compress', 'copy-fonts', function () {
        done();
    });
});