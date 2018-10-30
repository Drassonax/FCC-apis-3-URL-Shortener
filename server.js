'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
let dns = require('dns')

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI, {useNewUrlParser: true});
let urlSchema = new mongoose.Schema({
  longURL: String,
  shortURL: String
})
let URL = mongoose.model('URL', urlSchema)

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
let bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))


app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// create short url
app.post('/api/shorturl/new', (req, res) => {
  let urlToShorten = req.body.url
  if (urlToShorten.startsWith('https')) {
    urlToShorten = urlToShorten.slice(8)
  } else if (urlToShorten.startsWith('http')) {
    urlToShorten = urlToShorten.slice(7)
  }
  dns.lookup(urlToShorten, (err, address, family) => {
    if (err) {
      res.json({error: 'Invalid URL'})
    } else {
      URL.countDocuments({}, (err, count) => {
      URL.findOne({longURL: req.body.url}, (err, doc) => {
        if (doc) {
          res.json({
            originalURL: req.body.url,
            shortURL: doc.shortURL
          })
        } else {
          let newURL = new URL({
            longURL: req.body.url,
            shortURL: count
          })
          newURL.save()
          res.json({
            originalURL: req.body.url,
            shortURL: count
          })
        }
      })
      })
    }
  })
})

// redirect from short url to original link
app.get('/api/shorturl/:code', (req, res) => {
  URL.findOne({shortURL: req.params.code}, (err, doc) => {
    if (doc) {
      res.redirect(doc.longURL)
    } else {
      res.json({error: 'Invalid URL'})
    }
  })
})

//handle URLs with wrong format
app.get('*', (req, res) => {
  res.json({error: 'Wrong Format'})
})


app.listen(port, function () {
  console.log('Node.js listening ...');
});