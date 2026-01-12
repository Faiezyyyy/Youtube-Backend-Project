import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler (async (req,res) => {
    //console.log("FILES =>", req.files); //For sak eof debugging
    //console.log("BODY =>", req.body); //For sak eof debugging
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

export {
    registerUser,

}

