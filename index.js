require('dotenv').config();

/* All dependecies required */
const multer = require('multer');
const ejs = require('ejs');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
//const passportLocal = require('passport-local');

/*If register fails messages*/
let errorMessage; 

var options = {
    errorMessages: {
        MissingPasswordError: 'No password was given',
        AttemptTooSoonError: 'Account is currently locked. Try again later',
        TooManyAttemptsError: 'Account locked due to too many failed login attempts',
        NoSaltValueStoredError: 'Authentication not possible. No salt value stored',
        IncorrectPasswordError: 'Password or username are incorrect',
        IncorrectUsernameError: 'Password or username are incorrect',
        MissingUsernameError: 'No username was given',
        UserExistsError: 'A user with the given username is already registered'
    }
};

/*DB URL */
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

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


/* connection to the MongoDB */ 
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

/*DB collections */
const userSchema = new mongoose.Schema({
    name: String,
    lastName: String,
    email: String,
    password: String,
    admin: Boolean
});
userSchema.plugin(passportLocalMongoose);

/* Get a reference of the Schemas created above */
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); 


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
const Videogame = mongoose.model("Videogame", videogameSchema);

/* Get methods to access different html files */
app.get("/", (req, res)=>{
    console.log("INDEX FILE");
    console.log(req.user);
    if(req.isAuthenticated()){
        res.render(__dirname+"/index.ejs", {userLogged: req.user, authenticated:true});
    }else{
        res.render(__dirname+"/index.ejs", {authenticated:false});
    }
});

app.get("/xbox", (req, res)=>{
    Videogame.where({console: 2}).find((err, gameList) =>{
        if(!err){
            res.render(__dirname+"/views/xbox.ejs", {videogameList: gameList});
        }
    });
});

app.get("/ps4", (req, res)=>{
    Videogame.where({console: 1}).find((err, gameList) =>{
        if(!err){
            res.render(__dirname+"/views/playstation.ejs", {videogameList: gameList});
        }
    });
});

app.get("/switch", (req, res)=>{
    Videogame.where({console: 3}).find((err, gameList) =>{
        if(!err){
            res.render(__dirname+"/views/switch.ejs", {videogameList: gameList});
        }
    });
});

app.get("/pc", (req, res)=>{
    Videogame.where({console: 4}).find((err, gameList) =>{
        if(!err){
            res.render(__dirname+"/views/pc.ejs", {videogameList: gameList});
        }
    });
});

app.get("/login", (req, res)=>{
    res.render(__dirname+"/views/login.ejs", {errorMessage:" "});
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
    if(req.isAuthenticated){
        console.log('*******************************');
        console.log(req.user);
        res.render(__dirname+"/views/uploadVideogame.ejs", {previewImage: " ", status: false});
    }else{
        res.redirect('/');
    }
});

app.get("/gameInfo", (req, res) =>{
    res.render(__dirname+"/views/gameInfo.ejs");
});

app.get('/logout', (req, res)=>{
    req.logout();
    res.redirect('/');
});

/* Handling POST request */ 
app.post('/register', (req, res)=>{
    User.register({username: req.body.username, name:req.body.name, lastName: req.body.lastname, admin: false }, req.body.password, (err, user) => {
        if(err){
            console.log(err);
            res.render(__dirname+"/views/register.ejs", {message: err});
        }else{
            passport.authenticate('local')(req, res, function(){
                console.log(user);
                user.save();
                res.redirect('/');
            });
        }
    });
});

app.post('/login', (req, res)=>{
    User.findOne({username : req.body.username}, (err, user) =>{
        if(err || (user === null)){
            res.render(__dirname+"/views/login.ejs", {errorMessage: process.env.WRONG_CREDENTIALS});  
        }else{
            req.login(user, (error)=>{
                if(error){
                    console.log(user);
                    console.log(error);
                    res.render(__dirname+"/views/login.ejs", {errorMessage: error});  
                }else{
                    passport.authenticate('local')(req, res, ()=>{
                        console.log(req.user);
                        res.redirect('/');
                    });
                }
            });
        }
    });
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

app.post('/gameInfo', (req, res) => {
    console.log(req.body.gameId);
    console.log('#########################################');
    Videogame.where({_id : req.body.gameId}).findOne((err, selectedGame) =>{
        if(!err){
            console.log(selectedGame);
            res.render(__dirname+"/views/gameInfo.ejs", {selectedGame: selectedGame});
        }
    });
});
//App listen on port 3000
app.listen(3000, ()=>{
    console.log("Server started on port 3000");
});

