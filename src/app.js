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

export default app
