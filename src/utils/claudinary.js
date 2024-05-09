import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localurlpath) => {
        try {
            if(!localurlpath) return null

            // upload file on the cloudinary
            const res = await cloudinary.uploader.upload(localurlpath, {
                resource_type : 'auto'
            })
            // file uploaded successfully..
            console.log('file uploaded on cloudinary..', res.url);
                return res
        } catch (error) {
                fs.unlinkSync(localurlpath)  // remove the locally saved temporary file as the upload operations  got falied
                return null
        }
}


cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" }, 
  function(error, result) {console.log(result); });


  export default uploadOnCloudinary