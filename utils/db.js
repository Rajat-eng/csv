import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

let uri = process.env.DB_URI.toString();
const connectDB = () => {
  mongoose
    .connect(uri, { dbName: "Chat" })
    .then((data) => console.log(`Connected to DB: ${data.connection.host}`))
    .catch((err) => {
      throw err;
    });
};

export { connectDB };
