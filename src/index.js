//require('dotenv').config({path:'./env'}) //"dev": "nodemon src/index.js" when using require statement change to commonjs and add this line in package.json
import dotenv from "dotenv" //Use if want to maintainconsistency of code with import statement and type is modulejs also replace this in package.json //"dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
dotenv.config()

import connectDB from "./db/index.js";
import { app } from "./app.js";


connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERR: ",error);
        throw error
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);        
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed !!!", err);
})