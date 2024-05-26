import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async(req,res)=>{
    //get user details from frontend
   const {fullName , email , username , password} = req.body
//    console.log( email)

   
    //validate the data
    if([fullName,email,password,username].some((field)=>field.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }
    //check if user already exists
    const existedUser = User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser) {
        throw new ApiError(409,"User already exists with this email or username")
    }


    //check for image and check for avatar if avail //upload to cloudinary cause avatar is required 

   const avatarLocalPath =  req.files?.avatar[0]?.path  //ye middleware se uthaya
  const coverImageLocalPath =  req.files?.coverImage[0]?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required");
  }
  //upload them to cloudinary
 const avatar =  await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400 , "Avatar image upload failed please try again")
  }

    //now create user object and create entry in db
   const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    //remove password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    ) // checking if user created or not if created removing the pass and refreshtoken field
    
   if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User Registered Successfully")
   )
    


    //check for user creation
    //return response if not send error
  
    
})

export {registerUser}