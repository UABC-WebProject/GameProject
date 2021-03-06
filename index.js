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
var ObjectId = require('mongodb').ObjectId; 
//const passportLocal = require('passport-local');
var currentUser = null;
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
    title: String,
    description: String,
    path: String,
    genre: String,
    rate: String,
    score: Number,
    store: Array,
    developer: String,
    console: [Number]
});
const Videogame = mongoose.model("Videogame", videogameSchema);

const userSchema = new mongoose.Schema({
    name: String,
    lastName: String,
    email: String,
    password: String,
    admin: Boolean,
    gameList: Array
});
userSchema.plugin(passportLocalMongoose);

/* Get a reference of the Schemas created above */
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); 

/* Get methods to access different html files */
app.get("/", (req, res)=>{
    if(req.isAuthenticated()){
        res.render(__dirname+"/index.ejs", {landPage: "GameSpot-Home", userLogged: req.user, authenticated:true});
    }else{
        res.render(__dirname+"/index.ejs", {landPage: "GameSpot-Home", authenticated:false});
    }
});

app.get("/xbox", (req, res)=>{
    Videogame.where({console: 2}).find((err, gameList) =>{
        if(!err){
            if(req.isAuthenticated()){
                res.render(__dirname+"/views/xbox.ejs", {landPage: "GameSpot - Xbox One", videogameList: gameList, userLogged:req.user,authenticated: true});
            }
            else{
                res.render(__dirname+"/views/xbox.ejs", {landPage: "GameSpot - Xbox One", videogameList: gameList, userLogged:req.user, authenticated: false});
            }
        }
    });
});

app.get("/ps4", (req, res)=>{
    Videogame.where({console: 1}).find((err, gameList) =>{
        if(!err){
            if(req.isAuthenticated()){
                res.render(__dirname+"/views/xbox.ejs", {landPage: "GameSpot - Play Station 4", videogameList: gameList, userLogged:req.user,authenticated: true});
            }
            else{
                res.render(__dirname+"/views/xbox.ejs", {landPage: "GameSpot - Play Station 4", videogameList: gameList, userLogged:req.user, authenticated: false});
            }
        }
    });
});

app.get("/switch", (req, res)=>{
    Videogame.where({console: 3}).find((err, gameList) =>{
        if(!err){
            if(req.isAuthenticated()){
                res.render(__dirname+"/views/xbox.ejs", {landPage: "GameSpot - Nintendo Switch", videogameList: gameList, userLogged:req.user,authenticated: true});
            }
            else{
                res.render(__dirname+"/views/xbox.ejs", {landPage: "GameSpot - Nintendo Switch",videogameList: gameList, userLogged:req.user, authenticated: false});
            }
        }
    });
});

app.get("/pc", (req, res)=>{
    Videogame.where({console: 4}).find((err, gameList) =>{
        if(!err){
            if(req.isAuthenticated()){
                res.render(__dirname+"/views/xbox.ejs", {landPage: "GameSpot-PC",videogameList: gameList, userLogged:req.user,authenticated: true});
            }
            else{
                res.render(__dirname+"/views/xbox.ejs", {landPage: "GameSpot-PC",videogameList: gameList, userLogged:req.user, authenticated: false});
            }
        }
    });
});

app.get("/login", (req, res)=>{
    res.render(__dirname+"/views/login.ejs", {landPage: "Login", errorMessage:" ", authenticated:false});
});

app.get("/register", (req, res)=>{
    errorMessage = "";
    res.render(__dirname+"/views/register.ejs", {landPage: "Register", message:errorMessage, authenticated:false})
});


app.get("/failure", (req, res)=>{
    res.sendFile(__dirname+"/html/failure.html");
});

app.get("/uploadVideogame", (req, res)=>{
    if(req.isAuthenticated() && (currentUser.admin === true)){
        res.render(__dirname+"/views/uploadVideogame.ejs", {landPage: "Upload Complete", previewImage: " ", userLogged:req.user , authenticated: true ,status: false});
    }else{
        res.redirect('/');
    }
});

app.get("/gameInfo", (req, res) =>{
    var gameId= req.query.gameId;
    console.log(gameId);
    console.log('#########################################');
    Videogame.where({_id : gameId}).findOne((err, selectedGame) =>{
        if(!err){
            console.log(selectedGame.store);
            if(currentUser != null){
                res.render(__dirname+"/views/gameInfo.ejs", {landPage: "GameSpot", selectedGame: selectedGame, userLogged: currentUser, authenticated: true});
            }else{
                res.render(__dirname+"/views/gameInfo.ejs", {landPage: "GameSpot", selectedGame: selectedGame, userLogged: currentUser, authenticated: false});
            }
        }
    });
});

app.get('/settings', (req, res)=>{
    if(req.isAuthenticated()){
        res.render(__dirname + "/views/userSettings.ejs", {landPage: "Settings",userLogged:req.user, authenticated: true})
    }else{
        res.redirect('/');
    }
});

app.get('/deleteGame', (req, res) =>{
    res.redirect('/');
});

app.get('/logout', (req, res)=>{
    if(req.isAuthenticated()){
        req.logout();
        currentUser = null;
    }
    res.redirect('/');
});

app.get('/deleteAccount', (req, res)=>{
    if(req.isAuthenticated()){
        res.render(__dirname+"/views/accountDeleted.ejs", {landPage: "Warning!",userLogged:currentUser, authenticated: true, errorMessage: ""})
    }else{
        res.redirect('/');
    }
});


app.get('/updateUserInfo', (req, res)=>{
    if(req.isAuthenticated()){
        res.render(__dirname + "/views/updateUserInfo.ejs",{message: "", userLogged: currentUser, authenticated: true, landPage: "Update info"});
    }else{
        res.redirect('/login');
    }
});

app.get('/gameList', (req, res)=>{
    if(req.isAuthenticated()){
        //console.log("Number of list: " + currentUser.gameList.length);
        User.findOne({username: currentUser.username}, (err, updateUser) =>{
            if(!err){
                res.render(__dirname + "/views/userGameList.ejs",{successMessage: "", userLogged: updateUser, authenticated: true, landPage: "My game list"});
            }
        });
    }else{
        res.redirect('/login');
    }
});

app.get('/editGameInfo', (req, res)=>{
    if(req.isAuthenticated()){
        console.log("Videogame ID: " + req.query.videoGameId);
        const query = {_id: req.query.videoGameId}
        Videogame.findOne(query, (err, foundGame) =>{
            if(!err){
                console.log("Videogame: " + foundGame);
                res.render(__dirname + '/views/editGameInfo.ejs', {videogame: foundGame, successMessage: "", userLogged: currentUser, authenticated: true, landPage: "Edit Game"})
            }
        });
    }else{
        res.redirect('/');
    }
});

/* Handling POST request */ 
app.post('/register', (req, res)=>{
    User.findOne({username: req.body.username}, (err, foundUser)=>{
        console.log("Found user: " + foundUser );
        if(err || (foundUser != null)){
            console.log(err);
            res.render(__dirname+"/views/register.ejs", {authenticated:false, landPage: "Register", message: "*Email already in use."});
        }else{
            User.register({username: req.body.username, name:req.body.name, lastName: req.body.lastname, admin: false }, req.body.password, (err, user) => {
                if(err){
                    console.log(err);
                    res.render(__dirname+"/views/register.ejs", {landPage: "Register", message: err});
                }else{
                    passport.authenticate('local')(req, res, function(){
                        user.save();
                        currentUser = user;
                        console.log("Regiser succesful: "+ user);
                        res.redirect('/');
                    });
                }
            });
        }
    });
    
});

app.post('/login', (req, res)=>{
    console.log("Username:" + req.body.username);
    console.log("Password:" + req.body.password);
    User.findOne({username : req.body.username}, (err, user) =>{
        if(err || (user === null)){
            res.render(__dirname+"/views/login.ejs", {authenticated:false,landPage: "Login", errorMessage: process.env.WRONG_CREDENTIALS});  
        }else{
            req.login(user, (error)=>{
                console.log("********USER********");
                console.log(user);
                if(error){
                    console.log(error);
                    res.redirect('/login');
                }else{
                    passport.authenticate('local')(req, res, ()=>{
                        console.log("I'm here");
                        currentUser = req.user;
                        res.redirect('/');
                    });
                }
            });
        }
    });
});

app.post('/uploadVideogame',upload.single('gameImage'), (req, res) =>{
    console.log(req.user);
    var imageAlt = `Image ${req.file.filename} isn't available`;
    var imageRoute = '../images/' + req.file.filename;
    var consoleAvailability = [];
    var gameScore = Number(req.body.gameScore);
    var gameRate = req.body.gameRating;
    var gameGenre = req.body.gameGenre;
    var gameDeveloper = req.body.developer;
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
    store.save();
    const videogame = new Videogame({
        title: req.body.gameTitle,
        description:req.body.gameDescription,
        path: imageRoute,
        score: gameScore,
        genre: gameGenre,
        rate: gameRate,
        console: consoleAvailability,
        store: store,
        developer: gameDeveloper
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
        genre: gameGenre,
        authenticated: true,
        userLogged: currentUser,
        landPage: "Upload Complete"
    });
});

app.post('/gameInfo', (req, res) => {
    
});

app.post("/deleteAccount", (req, res) =>{
    currentUser.authenticate(req.body.userPassword, (err, thisModel, passwordErr)=>{
        if(err || passwordErr){
            console.log("err: " + err);
            console.log("passwordErr: " + passwordErr);
            res.redirect('/deleteAccount');
        }else{
            console.log("User "+ thisModel.username +" could be delete now!!!");
            const query = {username: {$eq: currentUser.username} };
            User.deleteOne( query, (error) => {
                if(error){
                    res.redirect('/deleteAccount');
                }else{
                    res.render(__dirname + "/views/success.ejs", {landPage: "GameSpot", successMessage:"Account was deleted successfully.", authenticated: false});
                }
            });
        }
    });
});

app.post('/updateUserInfo', (req, res) =>{
    console.log("I'm handling the change password method");
    const oldPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;
    currentUser.changePassword(oldPassword, newPassword, (err, thisModel, passwordErr)=>{
        if(err || passwordErr){
            console.log("err:" + err);
            console.log("passwordErr:" + passwordErr);
            res.render(__dirname + "/views/updateUserInfo.ejs",{message: "Check your password and try again.", userLogged: currentUser, authenticated: true, landPage: "Update info"});
        }else{
            res.render(__dirname + "/views/success.ejs", {userLogged: currentUser,landPage: "GameSpot", successMessage: "Password update succesfully ", authenticated:true, });
        }
    });
});

app.post('/gameList', (req, res) =>{
    var gameId = req.body.gamePick;
    Videogame.findOne({_id: gameId}, (err, selectedGame)=>{
        if(err){
            console.log("Error => " + err);
        }else{
            const query = { username: {$eq: currentUser.username} };
            const updateDocument = { $push: { "gameList": selectedGame } };
            User.updateOne(query, updateDocument, (err, result)=>{
                if(err){
                    console.log(err);
                }else{
                    res.redirect('/gameList');
                }
            });
        }
    });
});

app.post('/editGameInfo', (req, res)=>{
    if(currentUser.admin){
        var gameId = req.body.gameId;
        const store = new Store({
            storeName: req.body.gameStore,
            storeUrl: req.body.gameStoreUrl 
        });
        var game_title = req.body.gameTitle;
        var game_description =  req.body.gameDescription;
        var game_score = req.body.gameScore;
        var game_restriction = req.body.gameRating; 
        var game_genre = req.body.gameGenre;

        const query = { _id: {$eq: gameId }} ;
        const updateDocument = {
            $push: {"store": store},
            $set: {"title": game_title},
            $set: {"description": game_description},
            $set: {"score": game_score},
            $set: {"genre": game_genre},
            $set: {"rate": game_restriction},
        };
        Videogame.updateOne(query, updateDocument, (err, result)=>{
            if(!err){
                console.log("---------Videogame--------");
                console.log(result);
                res.redirect('/');
            }else{
                console.log(err);
                res.redirect('/');
            }
        });
    }else{
        res.redirect('/');
    }
});

app.post('/deleteGame', (req, res)=>{
    if(currentUser.admin){

        var gameId = ObjectId(req.body.deleteGameId);
        console.log("Delete game" + gameId);
        var query = {_id:{$eq: gameId}};
        Videogame.deleteOne(query, (err)=>{
            if(err){
                console.log(err);
            }else{
                
                res.render(__dirname + "/views/success.ejs", {userLogged:currentUser,landPage: "GameSpot", successMessage:"Videogame was deleted successfully.", authenticated: true});
            }
        });
    }else{
        res.redirect('/');
    }
});

app.post('/deleteGameOfMyList', (req, res)=>{
    console.log("Game ID:" + req.body.gameId);
    const query = {
        "username" : currentUser.username
    };
    const updateDocument = {
        $pull: {
            gameList:{_id : ObjectId(req.body.gameId)}
        } 
    };
    console.log(query);
    
    console.log(updateDocument);
    /* Videogame.findOne({_id: req.body.gameId}, (err, result)=>{
        console.log(result);
    }) */
    User.updateOne(query, updateDocument, {multi:true}, (err, result) => {
        if(err){
            console.log("Error:" + err);
        }else{
            console.log(result);
            res.redirect('/gameList');
        }
    });
});

//App listen on port 3000
app.listen(3000, ()=>{
    console.log("Server started on port 3000");
});
