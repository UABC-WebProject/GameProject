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
const bcrypt = require('bcrypt');
const { rejects } = require('assert');
const { useLayoutEffect } = require('react');
const saltRounds = 10;

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

/*If register fails messages*/
let errorMessage; 

/* connection to the MongoDB */ 
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    lastName: String,
    email: String,
    password: String,
    admin: Boolean
});

const videogameSchema = new mongoose.Schema({
    _id: String,
    title: String,
    description: String,
    path: String,
    console: [String]
});
const Videogame = mongoose.model("Videogame", videogameSchema);

/* Get methods to access different html files */
app.get("/", (req, res)=>{
    res.sendFile(__dirname+"/index.html"  );
});

app.get("/xbox", (req, res)=>{
    res.sendFile(__dirname+"/html/xbox.html");
});

app.get("/ps4", (req, res)=>{

    res.render(__dirname+"/views/playstation.ejs");
    //res.sendFile(__dirname+"/html/playstation.html");
});

app.get("/switch", (req, res)=>{
    res.sendFile(__dirname+"/html/switch.html");
});

app.get("/pc", (req, res)=>{
    res.sendFile(__dirname+"/html/pc.html");
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

app.post('/register', (req, res)=>{
    const fName = req.body.name;
    const lName = req.body.lastname;
    const user_password = req.body.password;
    const user_email = req.body.email;
    User.where({email: user_email}).findOne((err, getEmail)=>{
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
                    user.save();
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

    User.where(user_email).findOne((err, users)=>{
        if(err){
            console.log(err);
        }else{
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

app.post('/uploadVideogame',upload.single('gameImage'), (req, res, next) =>{
    var imageRoute = '../images/' + req.file.filename;
    var imageAlt = `Image ${req.file.filename} isn't available`;
    console.log(req.body.gameTitle);
    console.log(req.body.gameDescription);
    console.log(imageRoute);
    const videogame = new Videogame({
        _id: mongoose.mongo.ObjectId(),
        title: req.body.gameTitle,
        description:req.body.gameDescription,
        path: imageRoute
    });
    videogame.save();
    res.render(__dirname+"/views/uploadVideogame.ejs", {previewImage:  imageRoute,
        imageAlt: imageAlt, status: true});
});

//App listen on port 3000
app.listen(3000, ()=>{
    console.log("Server started on port 3000");
});

