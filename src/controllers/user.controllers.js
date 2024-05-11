
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from '../models/user.models.js'
import uploadOnCloudinary from "../utils/claudinary.js";
import ApiResponse from "../utils/ApiResponse.js";


const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken()
          user.save({validateBeforeSave : false})

          return {accessToken , refreshToken} 

    } catch (error) {
        throw new ApiError(500 , 'Access Token and Refresh are not available')
    }
}

const registerUser = asyncHandler( async (req, res) => {
       
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

        const {fullName , email, username, password} = req.body
        // console.log(username);

        // if (username === '') {
        //     throw new ApiError(400 , "FullName is required..")
        // }

            // second methods
        if ([fullName , email , username , password].some((field) => field?.trim() === "")) {
            throw new ApiError(400 , "All Fields are required..")
        }

        const existUser = await User.findOne({
            $or : [{username}, {email}]
        })
        if (existUser) {
            throw new ApiError(409 , "User has already login with existing username and email   ")
        }


        const avatarlocalPath = req.files?.avatar[0]?.path;
        // const coverImagelocalPath = req.files?.coverImage[0]?.path;

        let coverImagelocalPath ;

        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImagelocalPath = req.files.coverImage[0].path;

        }

        if (!avatarlocalPath) {
            throw new ApiError(400 , " Avatar is very important")
        }
        
        const avatar  = await uploadOnCloudinary(avatarlocalPath)
        const coverImage  = await uploadOnCloudinary(coverImagelocalPath)
        
        if (!avatar) {
            throw new ApiError(400 , " Avatar is very important")
        }

      const user = await  User.create({
            fullName,
            avatar : avatar.url,
            coverImage : coverImage?.url || '',
            email ,
            password,
            username : username.toLowerCase()
        })

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        if (!createdUser) {
            throw new ApiError(500 , 'something went wrong when you are trying to reagister')
        }

        return res.status(201).json(
            new ApiResponse(200 , createdUser , " User Registration successfully")
        )
})


export const loginUser = asyncHandler( async (req, res) => {
    //    req.body => data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookies

    const {email , username , password} = req.body

    if (!username || !email) {
        throw new ApiError(400 , "username or email is required")
    }
    const user = await User.findOne({
        $or : [{username}, {email}]
    })
    if (!user) {
        throw new ApiError(404 , "user not exists")
    }

    const ispasswordValid = await user.isPasswordCorrect(password)
    if (!ispasswordValid) {
        throw new ApiError(401 , "password is not valid")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpsOnly : true,
        secure : true
    }
    return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200 , 
            {
                user : loggedInUser , accessToken,
                refreshToken
            }, 
            "User has been login successfully..."
        )
    )
})




export default registerUser