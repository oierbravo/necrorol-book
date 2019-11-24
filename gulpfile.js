var path = require('path');
var gulp = require('gulp');
var remoteSrc = require('gulp-remote-src');
var concat = require('gulp-concat');

const nunjucks = require('gulp-nunjucks-render');
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
        //.pipe(markdownPdf())
        //.pipe(gap.prependText("{% extends 'html.html' %}"))
        //.pipe(nunjucks({ path: 'templates', manageEnv: configMarkdown }))
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
gulp.task('remote-md-items-concat', function() {
  return gulp.src(['./dist/items/*.md'])
     .pipe(concat(config.mdFullFilename))
     .pipe(gulp.dest(config.destination));
})
gulp.task('remote-md-items-rehype', function() {
  inlineStyle = "h1 {    font-size: 2em;  }  h2 {    font-size: 1.5em;  }  h3 {    font-size: 1.3em;  }  h4 {    font-size: 1.1em;  }  .A4{    width: 21cm;    font-size: 0.9em;  }td, th {text-align: left;}.h0Wrapper, .h3Wrapper, .h4Wrapper {page-break-inside :  avoid}  "
  return gulp.src(['./dist/necrorol-full.md'])
    .pipe(
      remark()
      .use(markdown)
      
      .use(normalizeHeadings)
      //.use(slug)
      //.use(sectionize)
      .use(remark2rehype)
    
    .use(section)
    .use(doc,{css:'gutenberg.css',style:inlineStyle})
      .use(format)
      //.use(html)
      
      
      .use(html))
      .pipe(rename({
        basename: "index",
        extname: ".html"
      }))
     .pipe(gulp.dest(config.destination));
})
gulp.task('remote-rehype', function() {
  return remoteSrc(listaMds, {
         base: null
     })
     //
     .pipe(
      remark()
      .use(markdown)
      
      .use(normalizeHeadings)
      //.use(slug)
      //.use(sectionize)
      .use(remark2rehype)
     // .use(doc)
     .use(section)
      .use(format)
      //.use(html)
      
      
      .use(html))

      .pipe(concat('rehype.html'))
     .pipe(gulp.dest(config.destination));
})
gulp.task('remote-rehype-inject', function() {
  return gulp.src(['templates/html.rehype.tmpl'])
   
     .pipe(fileinclude({
       prefix: '@@',
       basepath: '@file'
     }))
     .pipe(inlineCss())
     .pipe(rename({
      basename: "index",
       extname: ".html"
     }))
      .pipe(gulp.dest(config.destination));
 })
gulp.task('remote-rehype-full', function() {
  return remoteSrc(listaMds, {
         base: null
     })
     //
     .pipe(
      remark()
      .use(markdown)
      
      .use(normalizeHeadings)
      //.use(slug)
      //.use(sectionize)
      .use(remark2rehype)
     // .use(doc)
     .use(section)
      .use(format)
      //.use(html)
      
      
      .use(html))

      .pipe(concat('rehype.html'))
     .pipe(gulp.dest(config.destination));
})
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
      // Each file will be run through cheerio and each corresponding `$` will be passed here.
      // `file` is the gulp file object
      // Make all h1 tags uppercase
      var h1Id  = $('h1').attr('id');
      $('h1').parent().addClass('container h1');
      $('section h2').each(function () {
        var section = $(this);
        var h2Id = $(this).attr('id');
        //$(this).attr('id','');
        section.parent().addClass('h2 part part-' + h2Id);
      });    
    }))
     .pipe(concat('remark.html'))
     .pipe(gulp.dest(config.destination));
})

gulp.task('remote-remark-inject', function() {
 return gulp.src(['templates/html.tmpl'])
  
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
  //  .pipe(inlineCss())
    .pipe(rename({
      basename: "index",
      extname: ".html"
    }))
     .pipe(gulp.dest(config.destination));
})
gulp.task('remote-remark-pdf', function() {
  return gulp.src('./dist/index.html')
/*  .pipe(rename({
    dirname: "",
    extname: ".pdf"
  }))
    .pipe(html2pdf())*/
    .pipe(pdf({  format: "A4", orientation: "portrait"}))
    .pipe(rename({
      basename: "necrorol",
      //extname: ".pdf"
    }))
     .pipe(gulp.dest(config.destination));
})
gulp.task('pdf',function(){
  return gulp.src(path.join(config.destination,config.mdFullFilename))
     .pipe(markdownPdf({
       remarkable: {
         preset: 'full'
       },
       cssPath: './node_module/gutemberg-css/dist/gutenberg.css'
      // cssPath:'./node_modules/bootstrap/dist/css/bootstrap.css'
      // cssPath:'bootstrap.css'
     }))
     .pipe(gulp.dest(config.destination));
})
/*gulp.task('pdf',function(){
  
  return gulp.src(path.join(config.destination,config.mdFullFilename))
     .pipe(nunjucks({ path: './templatse.html', manageEnv: configMarkdown }))
     .pipe(gulp.dest(config.destination));
})
*/
gulp.task('css',function(){
  return gulp.src(['./node_modules/gutenberg-css/dist/gutenberg.css','templates/remark.css'])

     .pipe(gulp.dest(config.destination));
})



gulp.task('items', gulp.series(['css','remote-md-items','remote-md-items-concat','remote-md-items-rehype','remote-remark-pdf']));

gulp.task('full', gulp.series(['css','remote-md-full','remote-rehype-full','remote-rehype-inject','remote-remark-pdf']));

gulp.task('rehype', gulp.series(['css','remote-rehype','remote-rehype-inject','remote-remark-pdf']));

gulp.task('remote', gulp.series(['remote-md-items','remote-md-full']));
gulp.task('build', gulp.series(['remote','pdf']));


gulp.task('remark', gulp.series(['css','remote-remark','remote-remark-inject','remote-remark-pdf']));
