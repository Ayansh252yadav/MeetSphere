const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require("dotenv").config();

const express =require("express");
const app=express();
const port = process.env.PORT || 8080;
const {createServer} = require("node:http");

const cors=require("cors");

const {Server}=require("socket.io");
const status=require("http-status")
const authRoute=require('./routes/AuthRoute.js');

const mongoose=require("mongoose");

const url=process.env.MONGO_URI;
console.log("MONGO_URI:", process.env.MONGO_URI);
mongoose.connect(url)
.then(()=>{
    console.log("db connected successfully")
})
.catch((e)=>{
    console.log(e);
})
const connectToSocket=require('./controllers/socketMangers.js');
const server=createServer(app);
const io=connectToSocket(server);
const cookieParser = require("cookie-parser");
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use("/",authRoute);
app.get("/" ,(req,res)=>{
  res.send("<h1>welcome in the world of video conferencing</h1>");
})

server.listen(port,(req,res)=>{
console.log(`app is listening on port ${port}`);
})