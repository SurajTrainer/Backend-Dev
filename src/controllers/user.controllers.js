
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

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
})


export default registerUser