'use strict';

var gulp = require('gulp'), // Подключаем Gulp
	sass = require('gulp-sass'), // Подключаем Sass пакет https://github.com/dlmanning/gulp-sass
	browserSync = require('browser-sync').create(), // Подключаем Browser Sync
	reload = browserSync.reload, concat = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
	uglify = require('gulp-uglifyjs'), // Подключаем gulp-uglifyjs (для сжатия JS)
	cssnano = require('gulp-cssnano'), // Подключаем пакет для минификации CSS
	concatCss = require('gulp-concat-css'), rename = require('gulp-rename'), // Подключаем библиотеку для переименования файлов
	del = require('del'), // Подключаем библиотеку для удаления файлов и папок
	imagemin = require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
	pngquant = require('imagemin-pngquant'), // Подключаем библиотеку для работы с png
	cache = require('gulp-cache'), // Подключаем библиотеку кеширования
	autoprefixer = require('gulp-autoprefixer'), // Подключаем библиотеку для автоматического добавления префиксов
	sourcemaps = require('gulp-sourcemaps'), // Подключаем Source Map для дебагинга sass-файлов https://github.com/floridoo/gulp-sourcemaps
	fileinclude = require('gulp-file-include'), markdown = require('markdown'), htmlbeautify = require('gulp-html-beautify'), // Причесываем
	fs = require('fs'), // For compiling modernizr.min.js
	modernizr = require('modernizr'), // For compiling modernizr.min.js
	config = require('./modernizr-config'), // Path to modernizr-config.json
	replace = require('gulp-string-replace'), strip = require('gulp-strip-comments'), // Удалить комментарии
	stripCssComments = require('gulp-strip-css-comments'), // Удалить комментарии (css)
	removeEmptyLines = require('gulp-remove-empty-lines'), // Удалить пустые строки
	revts = require('gulp-rev-timestamp'), // Дабавить версии к подключаемым файлам
	beautify = require('gulp-beautify'), // Причесать js
	svgSprite = require("gulp-svg-sprites")
;

var path = {
	'dist': 'app'
};

// create svg sprites
let svgSocOutputPath = 'src/includes/sprites/output/soc';

gulp.task('cleanSocSprites', function () {
	return del.sync([svgSocOutputPath]); // Удаляем папку dist
});

gulp.task('tempSocSprites', ['cleanSocSprites'], function () {
	return gulp.src('src/includes/sprites/source/soc/*.svg')
		.pipe(svgSprite({
			layout: 'diagonal',
			padding: 0,
			baseSize: 60,
			common: 'soc-icon',
			svg: {
				sprite: "soc-sprite.svg",
			},
			cssFile: "css/_soc-sprite.css"
		}))
		.pipe(gulp.dest(svgSocOutputPath));
});

gulp.task('createSocSprite', ['tempSocSprites'], function () {
	return gulp.src([svgSocOutputPath + '/soc-sprite.svg'])
		.pipe(gulp.dest('src/img'));
});

gulp.task('htmlCompilation', function () { // Таск формирования ДОМ страниц
	return gulp.src(['src/__*.html'])
		.pipe(fileinclude({
			filters: {
				markdown: markdown.parse
			}
		}))
		.pipe(rename(function (path) {
			path.basename = path.basename.substr(2);
		}))
		.pipe(htmlbeautify({
			"indent_with_tabs": true,
			"max_preserve_newlines": 0
		}))
		.pipe(gulp.dest('./src/'));
});

/// Таск для переноса normalize
gulp.task('normalize', function () {
	return gulp.src('src/libs/normalize-scss/sass/**/*.+(scss|sass)')
		.pipe(stripCssComments())
		// .pipe(removeEmptyLines())
		.pipe(gulp.dest('src/_temp/'));
});

gulp.task('sassCompilation', ['normalize'], function () { // Создаем таск для компиляции sass файлов
	return gulp.src('src/sass/**/*.+(scss|sass)') // Берем источник
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'expanded', // nested (default), expanded, compact, compressed
			indentType: 'tab',
			indentWidth: 1,
			precision: 3,
			linefeed: 'lf' // cr, crlf, lf or lfcr
		}).on('error', sass.logError)) // Преобразуем Sass в CSS посредством gulp-sass
		.pipe(replace('../../', '../')) /// в css файлах меняем пути к файлам с ../../ на ../
		.pipe(replace('@charset "UTF-8";', ''))
		.pipe(autoprefixer([
			'last 5 versions', '> 1%', 'ie >= 9', 'and_chr >= 2.3' //, 'ie 8', 'ie 7'
		], {
			cascade: true
		})) // Создаем префиксы
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./src/css')) // Выгружаем результата в папку src/css
		.pipe(browserSync.reload({
			stream: true
		})); // Обновляем CSS на странице при изменении
});

gulp.task('mergeCssLibs', function () { // Таск для мержа css библиотек
	return gulp.src([
		'src/css/temp/*.css' // see gulpfile-special.js
		, 'src/libs/select2/dist/css/select2.min.css'
		// , 'src/lib/plugin/file.css'
	]) // Выбираем файлы для конкатенации
		.pipe(concatCss("src/css/libs.css", {
			rebaseUrls: false
		}))
		.pipe(gulp.dest('./')) // Выгружаем в папку src/css несжатую версию
		.pipe(cssnano()) // Сжимаем
		.pipe(rename({suffix: '.min'})) // Добавляем суффикс .min
		.pipe(gulp.dest('./')); // Выгружаем в папку src/css сжатую версию
});

gulp.task('createCustomModernizr', function (done) { // Таск для формирования кастомного modernizr
	modernizr.build(config, function (code) {
		fs.writeFile('src/js/modernizr.min.js', code, done);
	});
});

gulp.task('copyLibsScriptsToJs', ['copyJqueryToJs'], function () { // Таск для мержа js библиотек
	return gulp.src([
		// 'src/js/temp/smoothState.js' // https://github.com/miguel-perez/smoothState.js
		'src/libs/jquery-smartresize/jquery.debouncedresize.js' // "умный" ресайз
		, 'src/libs/jquery-placeholder/jquery.placeholder.min.js' // поддержка плейсхолдера в старых браузерах
		, 'src/libs/select2/dist/js/select2.full.min.js' // кастомный селект
		, 'src/libs/select2/dist/js/i18n/ru.js' // локализация для кастомного селекта
		, 'src/libs/slick-carousel/slick/slick.min.js' // slick slider
		, 'src/libs/matchHeight/dist/jquery.matchHeight-min.js' // скрипт для выравнивания элементов по максимальному
		, 'node_modules/object-fit-images/dist/ofi.min.js' // object-fit fix for a non-support browsers
		, 'src/libs/jquery-validation/dist/jquery.validate.min.js' // валидация форм
		// , 'src/libs/inputmask/dist/min/inputmask/jquery.inputmask.min.js' // маска для форм
		, 'src/libs/inputmask/dist/min/jquery.inputmask.bundle.min.js' // маска для форм
		// , 'src/libs/wow/dist/wow.min.js' // wow
	])
		.pipe(concat('libs.js')) // Собираем их в кучу в новом файле libs.min.js
		.pipe(gulp.dest('src/js'))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify()) // Сжимаем JS файл
		.pipe(gulp.dest('src/js')); // Выгружаем в папку src/js
});

gulp.task('copyJqueryToJs', function () { // Таск для копирования jquery в js папку
	return gulp.src([
		'src/libs/jquery/dist/jquery.min.js'
	])
		.pipe(gulp.dest('src/js'));
});

gulp.task('browserSync', function (done) { // Таск browserSync
	browserSync.init({
		server: {
			baseDir: "./src"
		},
		notify: false // Отключаем уведомления
	});
	browserSync.watch(['src/*.html', 'src/js/**/*.js', 'src/includes/**/*.json', 'src/includes/**/*.svg']).on("change", browserSync.reload);
	done();
});

gulp.task('watch', ['createSocSprite', 'createCustomModernizr', 'browserSync', 'htmlCompilation', 'sassCompilation', 'mergeCssLibs', 'copyLibsScriptsToJs'], function () {
	gulp.watch(['src/_tpl_*.html', 'src/__*.html', 'src/includes/**/*.json', 'src/includes/**/*.svg'], ['htmlCompilation']); // Наблюдение за tpl
	// файлами в папке include
	gulp.watch('src/sass/**/*.+(scss|sass)', ['sassCompilation']); // Наблюдение за sass файлами в папке sass
});

gulp.task('default', ['watch']); // Назначаем таск watch дефолтным

/************************************************************
 * Create Distribution folder and move files to it
 ************************************************************/

gulp.task('copyImgToDist', function () {
	return gulp.src('src/img/**/*')
		.pipe(cache(imagemin({ // Сжимаем их с наилучшими настройками с учетом кеширования
			interlaced: true,
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			optimizationLevel: 7, //степень сжатия от 0 до 7
			use: [pngquant()]
		})))
		.pipe(gulp.dest(path.dist + '/img')); // Выгружаем на продакшен
});

gulp.task('copyImgToDistFinal', ['copyImgToDist'], function () {
	return del.sync([path.dist + '/img/temp']); // Удаляем папку img/temp
});

gulp.task('buildDist', ['cleanDist', 'htmlCompilation', 'copyImgToDistFinal', 'sassCompilation', 'mergeCssLibs', 'createCustomModernizr', 'copyLibsScriptsToJs'], function () {

	gulp.src(['src/ajax/**/*'])
		.pipe(gulp.dest(path.dist + '/ajax')); // Переносим ajax-файлы в продакшен

	gulp.src(['src/video/**/*']) // Переносим видеофайлы в продакшен
		.pipe(gulp.dest(path.dist + '/video'));

	gulp.src(['src/css/main.css']) // Переносим main.css
		.pipe(removeEmptyLines()) // Удаляем пустые строки
		.pipe(cssnano()) // Compress
		.pipe(gulp.dest(path.dist + '/css'));

	gulp.src(['!src/css/_temp_*.css', '!src/css/libs.css', '!src/css/main.css', 'src/css/*.css']) // Переносим стили в продакшен
		.pipe(removeEmptyLines()) // Удаляем пустые строки
		.pipe(gulp.dest(path.dist + '/css'));

	gulp.src('src/fonts/**/*') // Переносим шрифты в продакшен
		.pipe(gulp.dest(path.dist + '/fonts'));

	gulp.src('src/js/common.js') // Переносим common.js в продакшен
		.pipe(strip({
			safe: true,
			ignore: /\/\*\*\s*\n([^\*]*(\*[^\/])?)*\*\//g // Не удалять /**...*/
		}))
		.pipe(removeEmptyLines())  // Удаляем пустые строки
		.pipe(beautify({  // Причесываем код
			"indent_with_tabs": true,
			"space_after_anon_function": true,
			"max_preserve_newlines": 2
		}))
		.pipe(uglify()) // Compress
		.pipe(gulp.dest(path.dist + '/js'));

	gulp.src(['!src/js/temp/**/*.js', '!src/js/**/_temp_*.js', '!src/js/libs.js', '!src/js/common.js', 'src/js/*.js']) // Переносим остальные скрипты в продакшен
		.pipe(gulp.dest(path.dist + '/js'));

	gulp.src('src/assets/**/*') // Переносим дополнительные файлы в продакшен
		.pipe(gulp.dest(path.dist + '/assets'));

	gulp.src(['!src/typography.html', '!src/inner.html', '!src/forms.html', '!src/__*.html', '!src/_tpl_*.html', '!src/_temp_*.html', 'src/*.html']) // Переносим HTML в продакшен
		.pipe(revts()) // Добавить версии подключаемых файлов. В html добавить ключ ?rev=@@hash в место добавления версии
		.pipe(gulp.dest(path.dist));

	gulp.src(['src/*.png', 'src/*.ico', 'src/.htaccess']) // Переносим favicon и др. файлы в продакшин
		.pipe(gulp.dest(path.dist));

});

gulp.task('cleanDist', function () {
	return del.sync([path.dist + '/']); // Удаляем папку dist
});

gulp.task('clearCache', function () { // Создаем такс для очистки кэша
	return cache.clearAll();
});