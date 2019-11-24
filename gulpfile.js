var path = require('path');
var gulp = require('gulp');
var remoteSrc = require('gulp-remote-src');
var concat = require('gulp-concat');

var package = require('./package.json');

const nunjucks = require('gulp-nunjucks');
const nunjucksMarkdown = require('nunjucks-markdown');
const markdownIt = require('markdown-it');
const gap = require('gulp-append-prepend');

//var markdownPdf = require("markdown-pdf");
const markdownPdf = require('gulp-markdown-pdf');

var pdf = require('gulp-html-pdf');

var html2pdf = require('gulp-html2pdf');
var listaMds = require('./lista-mds.js'); 
var listaMdsNames = require('./lista-mds.names.js'); 


var rename = require("gulp-rename");
var fileinclude = require('gulp-file-include')


var remark = require('gulp-remark')
var htmlRemark = require('remark-html')
const sectionize = require('remark-sectionize')
var normalizeHeadings = require('remark-normalize-headings')

var remark2rehype = require('remark-rehype')
var doc = require('rehype-document')
var format = require('rehype-format')
var html = require('rehype-stringify')

var markdown = require('remark-parse')
var slug = require('remark-slug')

const rehypeInline = require("rehype-inline");

var inlineCss = require('gulp-inline-css');

var section = require('@agentofuser/rehype-section').default

var cheerio = require('gulp-cheerio');

var config = {
  destination: './dist',
  mdFullFilename: 'necrorol-full.md',
  pdfFullFilename: 'necrorol-full.pdf'
}
function configMarkdown(env) {
  const renderer = markdownIt().render.bind(markdownIt());
  nunjucksMarkdown.register(env, renderer);
}
gulp.task('remote-md-full', function() {
     return remoteSrc(listaMds, {
            base: null
        })       
        .pipe(concat(config.mdFullFilename))
        .pipe(gulp.dest(config.destination));
})
gulp.task('remote-md-items', function(cb) {
  for (index in listaMdsNames){
      console.log(listaMdsNames[index].name); 
      remoteSrc(listaMdsNames[index].url, {
        base: null
      })

      .pipe(rename({
        dirname: "items",
        basename: listaMdsNames[index].name,
        prefix: index + '-',
        extname: ".md"
      }))
    .pipe(gulp.dest(config.destination));
   };
   cb() ;
});

gulp.task('remote-remark', function() {
  return remoteSrc(listaMds, {
         base: null
     })
     .pipe(
      remark()
      .use(normalizeHeadings)
      .use(sectionize)
      .use(slug)
      .use(htmlRemark))
    .pipe(gap.appendText('<div style="page-break-after: always;"></div>'))
    .pipe(cheerio(function ($, file) {
      var h1Id  = $('h1').attr('id');
      $('h1').parent().addClass('container h1');
      $('section h2').each(function () {
        var section = $(this);
        var h2Id = $(this).attr('id');
        section.parent().addClass('h2 part part-' + h2Id);
      });    
    }))
     .pipe(concat('remark.html'))
     .pipe(gulp.dest(config.destination));
})

gulp.task('remote-remark-inject', function() {
 return gulp.src(['templates/necrorol.html'])
  
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(rename({
      basename: "necrorol.v" + package.version
    }))
     .pipe(gulp.dest(config.destination));
})
gulp.task('remote-remark-pdf', function() {
  return gulp.src('./dist/necrorol.v' + package.version + '.html')
    .pipe(pdf({  format: "A4", orientation: "portrait"}))
    .pipe(rename({
      basename: "necrorol.v" + package.version
    }))
     .pipe(gulp.dest(config.destination));
})

gulp.task('css',function(){
  return gulp.src(['./node_modules/gutenberg-css/dist/gutenberg.css','templates/styles.css','./node_modules/bootstrap/dist/css/bootstrap.css'])

     .pipe(gulp.dest(config.destination));
})

gulp.task('index',function(){
  return gulp.src('templates/index.html')
        .pipe(nunjucks.compile({version: package.version}))
    .pipe(gulp.dest(config.destination));
});
gulp.task('remark', gulp.series(['remote-remark','remote-remark-inject','remote-remark-pdf']));
gulp.task('build', gulp.series(['css','remark','index']));


