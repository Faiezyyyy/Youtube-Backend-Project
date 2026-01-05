import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"

const connectDB = async ()=> { //Have to log connectionSring to chekc and study
    try {
        const connectionString = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB Connected !! DB HOST: ${connectionString.connection.host}`);        
    } catch (error) {
        console.log("MONGODB connection Failed", error);
        process.exit(1)
    }
}

export default connectDB