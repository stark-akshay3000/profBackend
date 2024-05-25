//this will createa  fn that will handle all funtion that need async await try catch 

const asyncHandler = (requestHandler)=>{
  return  (req,res,next)=>{
         Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))

    }
}

export {asyncHandler}

// const asyncHandler = () = {}
// const asyncHandler= (fun) =>()=>{}
// const asyncHandler =  (fun)=>async()=>{}  /Higher order function

// const asyncHandler = (fn)=>async(req,res,next)=>{
//   try{
//     await fn(req , res,next)

//   }catch(error){
//     res.status(error.code || 500).json({
//         success:false,
//         message:error.message
//     })
  
//   }
// }