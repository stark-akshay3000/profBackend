import mongoose  ,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new Schema({

    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true  //if you want to enable searching in fields the add index  ///but use rarely not in every field band baja deta performance ke

    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
      //if you want to enable searching in fields the add index 

    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true  //if you want to enable searching in fields the add index 

    },
    avatar:{
        type:String,  //cloudinary ka url
         required:true,
    },
    coverImage:{
        type:String,

    },

    watchHistory:[
    {
        type:Schema.Types.objectId,
        ref :"Video"
    }

],
 password:{
    type:String,
    required:[true,"Password is required"],



 },

 refreshToken:{
    type:String,
 }





},{timestamps:true})


userSchema.pre("save", async function (next){
    if( !this.isModified("password"))  return next();  //this will prevent updation of pass if someother thing changed---- pass nahe change hua to
    //next me badh jao pass ko kuch mat karo mean ye middleware se return ho le;;```~~~~~~
 this.password =bcrypt.hash(this.password,10)
 next();    //this is a middleware which will run pre to save data just before data going to save in db it will run and hash so it need a next flag
})


//custom methods
userSchema.methods.isPasswordCorrect = async function(password){
 await  bcrypt.compare(password ,this.password)
}

userSchema.methods.generateAccessToken = function(){
  return  jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:ACCESS_TOKEN_EXPIRY
    }

)
}
userSchema.methods.generateRefreshToken = function(){
   return jwt.sign({
        _id:this._id,
       
    },process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:REFRESH_TOKEN_EXPIRY
    }

)
}

export const User = mongoose.model('User',userSchema);