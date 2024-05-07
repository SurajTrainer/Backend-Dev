import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
       const connectionInst = await mongoose.connect(`${process.env.MONGODB_URI} / ${DB_NAME}`)
       console.log(`Mongodb connected ! and DB-Name is :: ${connectionInst.connection.host}`);
    } catch (error) {
        console.log('The error is In : ', error);
        process.exit()
    }
}

export default connectDB