import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,_,next) => { // Underscore tb hum use kr skty hain jb koi response na bhej rhy hon
try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        if(!user){
            throw new ApiError(401,"Invalid access token")
        }
    
        req.user = user
        next()
        
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid access token")
}

})