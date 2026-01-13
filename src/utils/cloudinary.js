import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import path from "path"

// console.log("CLOUDINARY ENV CHECK:", {
//   name: process.env.CLOUDINARY_CLOUD_NAME,
//   key: process.env.CLOUDINARY_API_KEY ? "SET" : "MISSING",
//   secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING",
// });


// cloudinary.config({
//   cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key:process.env.CLOUDINARY_API_KEY,
//   api_secret:process.env.CLOUDINARY_API_SECRET 
// })

cloudinary.config({
  cloud_name:'dfjm5m2fb', 
  api_key:'361131126327771',
  api_secret:'rtTW4XgL3GUGhEUopaUZf3yvaW0' 
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        const resolvedPath = path.resolve(localFilePath);

        //Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(resolvedPath, {
            resource_type: "auto",
        });

        //File has been uploaded succesfully
        console.log("File is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        return response
        
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally saved temp file as the uploaded operations got failed
        return null;
    }
}

export {uploadOnCloudinary}