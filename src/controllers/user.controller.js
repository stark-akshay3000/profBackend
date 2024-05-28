import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
//generate access and refresh tokens and saving in db as well as sending in response
const generateAccessAndRefreshTokens = async(userId)=>{
    try{
      const user =   await User.findById(userId)
     const accessToken =  user.generateAccessToken()
     const refreshToken =  user.generateRefreshToken()
     //after generating user token save the refresh token into database
     user.refreshToken= refreshToken;
    await user.save({validateBeforeSave:false}); //validatebeforesave: false it will just save the new thing wthout checking and validating the other fileds 
     // if not do this it will give error like pass not givem name not given so use this 

     return {accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    //get user details from frontend
   const {fullName , email , username , password} = req.body
//    console.log( email)

//    console.log(req)
    //validate the data
    if([fullName,email,password,username].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }
    //check if user already exists
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser) {
        throw new ApiError(409,"User already exists with this email or username")
    }


    //check for image and check for avatar if avail //upload to cloudinary cause avatar is required 

   const avatarLocalPath =  req.files?.avatar[0]?.path  //ye middleware se uthaya
//   const coverImageLocalPath =  req.files?.coverImage[0]?.path
//   console.log(avatarLocalPath)
let coverImageLocalPath
  if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
    coverImageLocalPath = req.files.coverImage[0].path
  }


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
const loginUser = asyncHandler(async(req,res)=>{
    //  console.log(req.body)
    const {email,username,password} = req.body
    // console.log(username)
    if(!(username || email)){
        throw new ApiError(400,"username or password is required")

    }
  const user =  await User.findOne({
        $or:[{username},{email}]
    })

    // console.log(user._id)

    if(!user){
        throw new ApiError(404,"User does not exist");
    }

    const isPasswordValid  = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials");
    }

   const {accessToken,refreshToken} =  await generateAccessAndRefreshTokens(user._id)
   
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken") //select me vo field -xyz rahenge jo nahe chahiye return me
   
   //setting up  cookies
       console.log("``~~~~~~~~~~~~~~~~~~~~~~~",loggedInUser)
   const options={
    httpOnly:true,  
    secure:true
   } 
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User loggedIn successfully"
        )
    )

})

const logOutUser = asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate( req.user._id,{  //middleware se cookie se user nikal ke  req me user daal diya 
    $unset:
    {
        refreshToken:1
    }
   },
   {
       new:true
    
   }
)  

const options={
    httpOnly:true,  
    secure:true
   } 
  
   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(
    new ApiResponse(200,"User Logged out ")
   )

  


})


const refreshAccessToken  = asyncHandler(async(req,res)=>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
   }
try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id); 
    if(!user){
      throw new ApiError(401,"Invalid Refresh Token");
    }
    if(incomingRefreshToken !== user?.refreshToken)
      {
      throw new ApiError(401,"Refresh Token is expired for user")
    }
     
    const options= {
      httpOnly:true,
      secure:true
    }
  
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(
      200,
      {accessToken,refreshToken:newRefreshToken},
      "Access Token refreshed"
    ))
} catch (error) {
    throw new ApiError(401,error?.message||"Invalid refresh token")
}

})

const changeCurrentPassword  = asyncHandler(async( req,res)=>{
    const {oldPassword , newPassword} = req.body;
   
   const user =  await User.findById(req.user?._id)
  const isPasswordCorrect =  user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid Password");
  }
  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(new ApiError(200,"Password change successfully"))

})

const getCurrentUser =asyncHandler(async(req,res)=>{
    return res.status(200).json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body
    if(!fullName|| !email){
        throw new ApiError(400,"fullname and email required");
    }

    User.findByIdAndUpdate(req.user?._id,{
          $set:{
            fullName,
            email:email
          }
    },{new:true}).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Account details updated Successfully"))


})

const updateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath =  req.files?.path
   if(!avatarLocalPath){
    throw new ApiError("Avatar path is missing")
   }
  const avatar=  await uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url){
    throw new ApiError("Error while uploading Avatar")
  }
  const user = await User.findByIdAndUpdate(req.user?._id,{
    $set:{
        avatar:avatar.url
    }
  },{new:true}).select("-password")
})
return res.status(200).json(new ApiResponse(200,user,"Avatar  updated successfully"))


const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath =  req.files?.path
    if(!coverImageLocalPath){
     throw new ApiError("Cover Image  is missing")
    }
   const cover =  await uploadOnCloudinary(coverImageLocalPath)
   if(!cover.url){
     throw new ApiError("Error while uploading Cover Image")
   }
   const user = await User.findByIdAndUpdate(req.user?._id,{
     $set:{
         coverImage:cover.url
     }
   },{new:true}).select("-password")

   return res.status(200).json(new ApiResponse(200,user,"Cover Image updated successfully"))
 })
export {registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage}