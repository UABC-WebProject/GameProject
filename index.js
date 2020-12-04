const React = require('react');
const ReactDOM = require('react-dom');
const ejs = require('ejs');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const url = 'mongodb://localhost:27017/gamespotDB';

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

const User = mongoose.model("User", userSchema);

/* Get methods to access different html files */
app.get("/", (req, res)=>{
    res.sendFile(__dirname+"/index.html"  );
});

app.get("/xbox", (req, res)=>{
    res.sendFile(__dirname+"/html/xbox.html");
});

app.get("/ps4", (req, res)=>{
    res.sendFile(__dirname+"/html/playstation.html");
});

app.get("/switch", (req, res)=>{
    res.sendFile(__dirname+"/html/switch.html");
});

app.get("/pc", (req, res)=>{
    res.sendFile(__dirname+"/html/pc.html");
});

app.get("/login", (req, res)=>{
    res.sendFile(__dirname+"/html/login.html");
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


app.post('/register', (req, res)=>{
    const fName = req.body.name;
    const lName = req.body.lastname;
    const user_password = req.body.password;
    const user_email = req.body.email;
    User.where({email: user_email}).findOne((err, getEmail)=>{
        if(err || getEmail != null){
            console.log(req.body);
            errorMessage = "*Email already exists"
            res.render(__dirname+'/views/register.ejs', {message:errorMessage});
            //res.redirect('/register');

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

    User.where(user_email).findOne((err, users)=>{
        if(err){
            console.log(err);
        }else{
            if(users.password === user_password){
                console.log("SUCCESS");
                res.redirect('/');
            }else{
                console.log("WRONG");
                res.redirect('/login');
            }
        }
    })
});

//App listen on port 3000
app.listen(3000, ()=>{
    console.log("Server started on port 3000");
});

