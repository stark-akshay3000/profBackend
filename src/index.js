import connectDB from "./db/index.js";
// require('dotenv').config     
import dotenv from 'dotenv'
dotenv.config({
    path:'./env'
})

connectDB();