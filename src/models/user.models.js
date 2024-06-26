
import mongoose ,{Schema} from "mongoose"; 
import bcrypt from "bcrypt"
import jwt  from "jsonwebtoken";


const userSchema = new Schema({ 
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true,
    },
    fullName : {
        type : String,
        unique : true,
        trim : true,
    },
    avatar : {
        type : String, // cloudinary url
        required : true,
    },
    coverImage : {
        type : String, // cloudinary url
    },
    watchHistory : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    password : {
        type : String,
        required : [true , 'This is very important/ required']
    },
    refreshToken : {
        type : String
    },
},{timestamps : true})


// using pre hook for securing password 
userSchema.pre('save', async function (next) {
    if(!this.modified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next();
})


// making our self methods
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password , this.password)
}


// creating token  methods
userSchema.methods.generteAccessToken = function(){
      return  jwt.sign({
            _id : this._id,     
            email : this.email,
            userSchema : this.userSchema,
            fullName : this.fullName,
        },
    process.env.ACCESS_TOKEN_SECRET, 
{
    expiresIn : ACCESS_TOKEN_EXPIRY
})
}
userSchema.methods.generteRefreshToken = function(){
    return  jwt.sign({
        _id : this._id,  
    },
process.env.REFRESH_TOKEN_SECRET, 
{
expiresIn : REFRESH_TOKEN_EXPIRY
})
}

export const User = mongoose.model("User",userSchema)