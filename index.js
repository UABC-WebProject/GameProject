const path = require('path');
const multer = require('multer');
const React = require('react');
const ReactDOM = require('react-dom');
const ejs = require('ejs');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const url = 'mongodb://localhost:27017/gamespotDB';

/* configure how the image gonna be store */
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'public/images/');
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
});

var upload = multer({storage:storage});
/* setting-up password encryption method */
/* const bcrypt = require('bcrypt');
const { rejects } = require('assert');
const { useLayoutEffect } = require('react');
const saltRounds = 10; */

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

/*If register fails messages*/
let errorMessage; 

/* connection to the MongoDB */ 
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});

/*DB collections */
const userSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    lastName: String,
    email: String,
    password: String,
    admin: Boolean
});
const storeSchema = new mongoose.Schema({
    storeName: String,
    storeUrl: String
});
const Store = mongoose.model("Store", storeSchema);

const consoleSchema = mongoose.Schema({
    _id: Number,
    consoleName: String
});
const Console = mongoose.model("Console", consoleSchema);

const videogameSchema = new mongoose.Schema({
    _id: Number,
    title: String,
    description: String,
    path: String,
    genre: String,
    rate: String,
    score: Number,
    store: Array,
    console: [Number]
});



/* Get a reference of the Schemas created above */
const User = mongoose.model("User", userSchema);
const Videogame = mongoose.model("Videogame", videogameSchema);





/* Get methods to access different html files */
app.get("/", (req, res)=>{
    res.sendFile(__dirname+"/index.html"  );
});

app.get("/xbox", (req, res)=>{
    Videogame.where({console: 2}).find((err, gameList) =>{
        if(!err){ 
            console.log("XBOX" + gameList);
            res.render(__dirname+"/views/xbox.ejs", {videogameList: gameList});
        }
    });
});

app.get("/ps4", (req, res)=>{
    Videogame.where({console: 1}).find((err, gameList) =>{
        if(!err){ 
            console.log("PS4" + gameList);
            res.render(__dirname+"/views/playstation.ejs", {videogameList: gameList});
        }
    });
});

app.get("/switch", (req, res)=>{
    Videogame.where({console: 3}).find((err, gameList) =>{
        if(!err){ 
            console.log("SWITCH" + gameList);
            res.render(__dirname+"/views/switch.ejs", {videogameList: gameList});
        }
    });
});

app.get("/pc", (req, res)=>{
    Videogame.where({console: 4}).find((err, gameList) =>{
        if(!err){ 
            console.log(gameList);
            res.render(__dirname+"/views/pc.ejs", {videogameList: gameList});
        }
    });
});

app.get("/login", (req, res)=>{
    res.render(__dirname+"/views/login.ejs", {message:" "});
});

app.get("/register", (req, res)=>{
    errorMessage = "";
    res.render(__dirname+"/views/register.ejs", {message:errorMessage})
});

app.get("/success", (req, res)=>{
    res.sendFile(__dirname+"/html/success.html");
});

app.get("/failure", (req, res)=>{
    res.sendFile(__dirname+"/html/failure.html");
});

app.get("/uploadVideogame", (req, res)=>{
    res.render(__dirname+"/views/uploadVideogame.ejs", {previewImage: " ", status: false});
});

app.get("/gameInfo", (req, res) =>{
    res.render(__dirname+"/views/gameInfo.ejs");
});

/* POST methods */ 
app.post('/register', (req, res)=>{
    const fName = req.body.name;
    const lName = req.body.lastname;
    const user_password = req.body.password;
    const user_email = req.body.email;

    /* Querying to validate if that the email we want to store doesn't duplicate */
    User.where({email: user_email}).findOne((err, getEmail)=>{
        /* If email already exists */
        if(err || getEmail != null){
            errorMessage = "*Email already exists"
            res.render(__dirname+'/views/register.ejs', {message:errorMessage});
        }else{
            User.find((err, userList)=>{
                if(err){
                    res.redirect('/failure');
                }else{
                    /* register new user */
                    const user = new User({
                        _id: userList.length + 1,
                        name: fName,
                        lastName: lName,
                        email:user_email,
                        password: user_password,
                        admin: false
                    });
                    user.save(); //Save new user
                    res.redirect('/success');
                }
            });
        }
    });
});

app.post('/login', (req, res)=>{
    const user_email = req.body.email;
    const user_password = req.body.password;
    let error_message; 

    /* Querying to fetched data */ 
    User.where(user_email).findOne((err, users)=>{
        if(err){
            console.log(err);
        }else{
            /* Validate credentials to check the data match */
            if(users.password === user_password){
                console.log("SUCCESS");
                res.redirect('/');
            }else{
                console.log("WRONG");
                error_message = "Check your password."
                res.render(__dirname+'/views/login.ejs', {message:error_message});
            }
        }
    })
});

app.post('/uploadVideogame',upload.single('gameImage'), (req, res) =>{
    var imageAlt = `Image ${req.file.filename} isn't available`;
    var imageRoute = '../images/' + req.file.filename;
    var consoleAvailability = [];
    var gameScore = Number(req.body.gameScore);
    var gameRate = req.body.gameRating;
    var gameGenre = req.body.gameGenre;

    /* Adds the console availability */
    if(req.body.ps4 != undefined)
        consoleAvailability.push(Number(req.body.ps4));
    if(req.body.xbox != undefined)
        consoleAvailability.push(Number(req.body.xbox));
    if(req.body.switch != undefined)
        consoleAvailability.push(Number(req.body.switch));
    if(req.body.pc != undefined)
        consoleAvailability.push(Number(req.body.pc));

    const store = new Store({
        storeName: req.body.gameStore,
        storeUrl: req.body.gameStoreUrl 
    });
    Videogame.find( (err, gameList) => {
        if(!err){
            const videogame = new Videogame({
                _id: gameList.length + 1,
                title: req.body.gameTitle,
                description:req.body.gameDescription,
                path: imageRoute,
                score: gameScore,
                genre: gameGenre,
                rate: gameRate,
                console: consoleAvailability,
                store: store
            });
            /* Saving the videogame in the DB */
            videogame.save();

            /* Redirecting to the updated page */
            res.render(__dirname+"/views/uploadVideogame.ejs", {
                previewImage:  imageRoute,
                imageAlt: imageAlt, 
                status: true,
                score: gameScore,
                rate: gameRate,
                genre: gameGenre
            });
        }
    });
});

//App listen on port 3000
app.listen(3000, ()=>{
    console.log("Server started on port 3000");
});

