var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const {engine:hbs} = require('express-handlebars')
//or var hbs=require("express-handlebars")
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var fileupload=require('express-fileupload')
var db=require("./config/connection")
var session=require('express-session')
var hbs_helper=require('./config/handlebars-helper/handlebar-helper')
const passport = require('passport');
var app = express();
app.use(session({
  secret: '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',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// or app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout: 'layout',layoutsDir:__dirname+'/views/layouts/',partialsDir:__dirname+'/views/partials/'}))
app.engine('hbs',hbs({extname:'hbs',helpers:hbs_helper,defaultLayout: 'layout',layoutsDir:__dirname+'/views/layouts/',partialsDir:__dirname+'/views/partials/'}))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());  
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileupload())
app.use(session({secret:'key',resave: false,saveUninitialized: true,cookie:{maxAge:60*60*1000}}))
db.connect((err)=>{
  if(err) console.log(err)
  else  console.log("connection created")

})
app.use('/', userRouter);
app.use('/admin', adminRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
