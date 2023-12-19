const express = require('express');
const path = require('path');
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


mongoose.connect("mongodb://localhost:27017" , {
    dbName : "backend",
}).then(()=>{
   console.log("database is connected") 
}).catch(()=>{
    console.log("Database is not connected");
})



// using middlewares
app.use(express.static(path.join(path.resolve() , "public")));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// creating the Schema
const userSchema = new mongoose.Schema({
    name : String,
    email : String,
    password : String
});
const User = mongoose.model('User',userSchema);

//Setting up view Engine
app.set("view engine" , "ejs");

// Middleware for checking and handling the authentication

const isAuthenticated = async(req , res , next)=>{
    const {Token} =req.cookies;
    if(Token){
        const decoded = jwt.verify(Token , "beproud")
        console.log(decoded);
        req.user = await User.findById(decoded._id);
       next();
    }else{
        res.redirect("/login" );
    }
}

// endpoint as a home page for rendering the login and logout file
app.get('/',isAuthenticated, (req, res  ) => {
    res.render("logout" , {name : req.user.name});
 });

//  endpoint for registering the user

app.get("/register", (req, res) => {
    res.render("register");
});
//   endpoint for doing login
app.get("/login", (req, res) => {
    res.render('login');
});
// endpoint  for redirecting to the register page and also checking if the password is the same
app.post("/login", async(req, res) => {
    const {email, password } = req.body;
    let user = await User.findOne({email})
    if (!user){
        return res.redirect("register");
    }
    
    let isMatch = await bcrypt.compare(password , user.password); 
    if(!isMatch){
        return res.render("login" , {email , message : "Please Enter the Valid Password"});
    }
    const token = jwt.sign({_id : user._id} , "beproud");
    res.cookie("Token" , token, {
     httpOnly: true , expires : new Date(Date.now()+ 60*1000)
    });
    res.redirect("/")
});


// Endpoint for doing  the register page if user is not login
app.post('/register', async(req, res) => { 
const {name , email , password} = req.body;

// logic for creating the hashed password
const hashedPassword = await bcrypt.hash(password,10);

// logic for creating the user in the database
let user =await User.create({name , email , password:hashedPassword});

// logic for finding wether user with login id is already exists or not, if it exists then it should redirect to the login page.
 user = await User.findOne({email})
 if(user){
   return res.redirect("/login");
 }
// logic for combining the JWT and cookie
const token = jwt.sign({_id : user._id} , "beproud");
    res.cookie("Token" , token, {
     httpOnly: true , expires : new Date(Date.now()+ 60*1000)
    });
    res.redirect("/")
});

// Endpoint for doing the Logout 

app.get('/logout', (req, res) => { 
    res.cookie("Token" , null, {
     httpOnly: true , expires : new Date(Date.now())
    });
    res.redirect("/")
});


app.listen(5000 , ()=>{
    console.log("Server is running.")
})