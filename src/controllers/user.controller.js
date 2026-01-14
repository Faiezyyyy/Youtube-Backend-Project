import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessandRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refrehs and acces tokens")
    }
}

const registerUser = asyncHandler (async (req,res) => {
    
    console.log("FILES =>", req.files); //For sake of debugging
    console.log("BODY =>", req.body); //For sake of debugging
    // get user details from frontend
    // validation - not empty
    // check if user already exists
    // check ifor images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response
    
    const {username, fullName, email, password} = req.body
    
    // if(fullName === ""){ //You can use multiple if-else for validations in this case
    //     throw new ApiError(400, "Full Name is required")
    // }

    //Advance code for validation
    if ( //some is js function which accept multiple arguments using if-else and returns true and false
        [fullName,email,username,password].some((field) => {
            !field || field.trim() === ""
        })
    ) { 
        throw new ApiError(400, "All fields is required")
    }

    //Email Validation that @ is include to ve done here

    const existedUser = await User.findOne({
        $or: [{email},{username}] //By adding $ sign in mongoose query we can use logical opeartaors in our qeury
    })

    if(existedUser){
        throw new (409, "User with email or userame already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path; //[0] means multer ki provided additional properties mai sy forst propert ko ly kr us mai sy file path extract kro 
    //const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) 

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()

    })

    const createdUser = await User.findById(user._id).select( //slect is method in which we pass such fields which we want to select by defualt all is slect and by using minus sign we can give which we do not wantin string
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Somehting went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler (async (req, res) => {
    // req body -> data
    // username and email check
    // find the user
    // password check
    // access and refresh token
    // send cookies
    // send res

    const {username, email, password} = req.body

    if(!(username || email)){
        throw new ApiError(400, "Username or Email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

     if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200,{
            user: loggedInUser, accessToken, refreshToken,
        },
        "User loggedin successfully" 
        )
    )
})

const logoutUser = asyncHandler(async(req,res) => {
    
    User.findByIdAndUpdate(
        req.user._id, //query
        { //What to set or update
            $set: {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler (async (re1,res) => {
    
    const incomingRefreshoken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshoken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken= jwt.verify(incomingRefreshoken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshoken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const {accessToken, newRefreshToken} = await generateAccessandRefreshTokens(user._id)
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        return res
        .status(200)
        .clearCookie("accessToken", accessToken, options)
        .clearCookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,{
                accessToken,
                refreshToken: newRefreshToken
                }, 
                "User logged out"
            ) 
        )   
    
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler (async (req,res) => {
    
    const {oldPassword, newPassword} = req.body
    
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword

    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Password changed successfully"
    ))

})

const getCurrentUser = asyncHandler (async (req,res) => {
    
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "Current user fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler (async (req,res) => {
    
    const{email, fullName, username, } = req.body  

    if(!(fullName || email || username)) {
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email : email, //Canuse both ways like with colon and with colon both are good
                username
            }
        },
        {new: true} //By adding this objetc and making the new keyword value true app ko update hny k baad wli info milti hai 
    ).select("-password ")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account details updated successfully"
    ))
     
})

const updateUserAvatar = asyncHandler (async (req,res) => {
    
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    
    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url  //Avatar url isi liya hai becuase hum sirf uska url lena chah rhy hain na k avatar object ly rhy hain sirf avatar likhny sy pura object ho jaye ga              
            }
        },
        {new: true}  
    ).select("-password ")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Avatar Image updated successfully"
    ))
})

const updateUserCoverImage = asyncHandler (async (req,res) => {
    
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400,"Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    
    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading ocover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url  //Avatar url isi liya hai becuase hum sirf uska url lena chah rhy hain na k avatar object ly rhy hain sirf avatar likhny sy pura object ho jaye ga              
            }
        },
        {new: true}  
    ).select("-password ")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Cover Image updated successfully"
    ))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
}

