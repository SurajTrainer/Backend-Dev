import { jwt } from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from '../models/user.models.js'
import uploadOnCloudinary from "../utils/claudinary.js";
import ApiResponse from "../utils/ApiResponse.js";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken()
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, 'Access Token and Refresh are not available')
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    // validation - should not empty
    // check if user already exist - username , email
    // check for images
    // check for avatar
    // upload them to cloudinary , avatar
    // create user object - create entry in db
    // remove password and token field from response
    // check for user creation
    // return res

    const { fullName, email, username, password } = req.body
    // console.log(username);

    // if (username === '') {
    //     throw new ApiError(400 , "FullName is required..")
    // }

    // second methods
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields are required..")
    }

    const existUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existUser) {
        throw new ApiError(409, "User has already login with existing username and email   ")
    }


    const avatarlocalPath = req.files?.avatar[0]?.path;
    // const coverImagelocalPath = req.files?.coverImage[0]?.path;

    let coverImagelocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagelocalPath = req.files.coverImage[0].path;

    }

    if (!avatarlocalPath) {
        throw new ApiError(400, " Avatar is very important")
    }

    const avatar = await uploadOnCloudinary(avatarlocalPath)
    const coverImage = await uploadOnCloudinary(coverImagelocalPath)

    if (!avatar) {
        throw new ApiError(400, " Avatar is very important")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || '',
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, 'something went wrong when you are trying to reagister')
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, " User Registration successfully")
    )
})


export const loginUser = asyncHandler(async (req, res) => {
    //    req.body => data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookies

    const { email, username, password } = req.body

    if (!username || !email) {
        throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "user not exists")
    }

    const ispasswordValid = await user.isPasswordCorrect(password)
    if (!ispasswordValid) {
        throw new ApiError(401, "password is not valid")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpsOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken,
                    refreshToken
                },
                "User has been login successfully..."
            )
        )
})


export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpsOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200 , {} , "User Logged out.."))
})


export const refreshAceessToken = asyncHandler(async (req ,res) => {
    const incomingRefreshToken =   req.cookies.refreshToken || req.body.refreshToken
    
    if (incomingRefreshToken) {
        throw new ApiError(401 , "Request is Unauthorized")
    }

    
   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
 
 const user = await User.findById(decodedToken?._id)
 if (!user) {
     throw new ApiError(401 , "Invalid refresh Token")
 }
 if (!incomingRefreshToken !== user?.refreshToken ) {
     throw new ApiError(401 , "Your Refresh Token is expired..")
 }
 
 const options = {
     httpsOnly : true,
     secure : true
 }
 
 const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id)
 
 return res.status(200)
 .cookie("accessToken" , accessToken , options)
 .cookie("refreshToken" , newRefreshToken , options)
 .json(
     new ApiResponse(
         200 , 
         {accessToken , refreshToken : newRefreshToken},
         "Your Access Token has been refreshed..."
     )
 )
 
   } catch (error) {
    throw new ApiError(401 , error?.message || "Invalid refresh Token ")
   }
})


export const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

export const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

export const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

export const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})


export const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }




    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})




export default registerUser