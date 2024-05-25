import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser" //can access user cookie and set user  cookies in seerver thats why we are using this


const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

//allowing json data
app.use(express.json({
    limit:"16kb"
}))
//allowing data can be taken from urls also setting limit not a required field
app.use(express.urlencoded({extended:true,limit:"16kb"}))
//serving static files like some images or other featuures
app.use(express.static("public"))
app.use(cookieParser())




// (err,req,res,next) actually 4 things are there // 
// \??next is flag for middlewares like you have more than one middleware so one will check then pass the flag to next middleware




//routes are hereeeeeeee
import userRouter from "./routes/user.routes.js"

app.use("/users",userRouter)   


export {app}