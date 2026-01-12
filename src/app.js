import express from 'express'
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

//If data is from CORS or frontend
app.use(cors({ //app.use() is only used when there is any configuration settings needed or middleware is used
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({ //If data is coming from JSON
    limit:"16KB"
}))

app.use(express.urlencoded({//If data is coming from URL
    extended:true,
    limit:"16KB"
}))

app.use(express.static("public"))// If want to store files,folders,images stored in server andpublic is because I have choosed this folder in my file

app.use(cookieParser())//If want to apply CRUD ops on user's browser

//routes import
import userRouter from "./routes/user.routes.js"

//Routes declaration
app.use("/api/v1/users",userRouter)


export {app} 