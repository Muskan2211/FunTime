//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));


app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-muskan:"+ process.env.PASSWORD +"@cluster0.bmbo9.mongodb.net/gamesDB", {useNewUrlParser: true, useUnifiedTopology: true} );
mongoose.set("useCreateIndex", true);

const itemsSchema=new mongoose.Schema({
  email:String,
  password:String,
  truth:[String],
  dare:[String],
  player:[String]
});

itemsSchema.plugin(passportLocalMongoose);

const Item = mongoose.model("Item", itemsSchema);

passport.use(Item.createStrategy());
passport.serializeUser(function(user, done){
  done(null, user.id);
});
passport.deserializeUser(function(id, done){
  Item.findById(id, function(err, user){
    done(err, user);
  });
});

var today=new Date();
var year=today.getFullYear();
var islogin=false;

app.get("/", function(req, res){
  res.render("informationpage", {yearmat:year, btntype:islogin});
});

app.get("/login", function(req, res){
  res.render("login", {yearmat:year, btntype:islogin});
});

app.get("/register", function(req, res){
  res.render("register",{yearmat:year, btntype:islogin});
});

app.get("/matrix", function(req, res){
  if(req.isAuthenticated()){
    islogin=true;
    Item.findById(req.user.id, function(err, foundUser){
      if(err){
        console.log(err);
        res.redirect("/login");
      }else{
        if(foundUser){

          res.render("matrix",{
            yearmat:year,
            newPlayers: foundUser.player,
            newTruths: foundUser.truth,
            newDares: foundUser.dare,
            btntype:islogin
          });
        }
      }
    });
  }
});


app.post("/question", function(req, res){
  let curr_questions = req.body.questions;
  let curr_truth=req.body.truth;
  let curr_dare=req.body.dare;


  Item.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        if(curr_truth=="on" && curr_dare=="on"){
          foundUser.truth.push(curr_questions);
          foundUser.dare.push(curr_questions);
          foundUser.save(function(){
            res.redirect("/matrix");
          });
        }
        else if(curr_truth=="on"){
          foundUser.truth.push(curr_questions);
          foundUser.save(function(){
            res.redirect("/matrix");
          });
        }
        else if( curr_dare=="on"){
          foundUser.dare.push(curr_questions);
          foundUser.save(function(){
            res.redirect("/matrix");
          });
        }
        else if(impo!="on" && urg!="on"){
          res.redirect("/matrix");
        }
      }
    }
  });
});

app.post("/players", function(req, res){
  Item.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    }else{
      if(foundUser){
        let names = req.body.playernames;
        let nameArr = names.split(',');
        foundUser.player = foundUser.player.concat(nameArr);
        
        for (let i = foundUser.player.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1));      
          let temp = foundUser.player[i];
          foundUser.player[i] = foundUser.player[j];
          foundUser.player[j] = temp;
        }
        foundUser.save(function(){
          res.redirect("/matrix");
        });
      }
    }
  });
});

app.get("/logout", function(req, res){
  req.logout();
  islogin=false;
  res.redirect("/");
});

app.post("/login", function(req, res){
  const user = new Item({
    usename: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/matrix");
      });
    }
  });
});

app.post("/register", function(req, res){
  Item.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/matrix");
      });
    }
  });
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function (){
  console.log("server started on port 3000");
});
