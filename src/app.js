import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express()

// 1 way to write which is used everyhwere..
app.use(cors())


// 2nd way to write 
// app.use(cors({
//     origin : process.env.CORS_ORIGIN,
//     credentials : true
// }))


// for json file
app.use(express.json({limit : "20kb"}))

// for url links
app.use(express.urlencoded({extended : true, limit :'20kb'}))


app.use(express.static("public"));

app.use(cookieParser())


// routes import
import useRouter from './routes/user.routers.js';


// routes declaration
app.use("/api/user", useRouter)




export default app
