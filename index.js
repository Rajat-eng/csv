import express from "express";
import multer from "multer";
import path from "path";
import { connectDB } from "./utils/db.js";
import { v2 as cloudinary } from "cloudinary";
import { Worker } from "worker_threads";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import Product from "./model/Product.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
dotenv.config({
  path: "./.env",
});

let requestStatus = {};

const app = express();
const upload = multer({ dest: "uploads/" });

connectDB();

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
    const __dirname = path.dirname(__filename); // get the name of the directory
    const filePath = path.join(__dirname, req.file.path);
    const requestId = uuidv4();
    const worker = new Worker("./worker.js", {
      workerData: { filePath, requestId },
    });
    requestStatus[requestId] = { status: "processing" };
    worker.on("message", async (message) => {
      if (message.success) {
        // console.log("File processed successfully", message.data);
        const product = await Product.create({
          requestId,
          ...message.data,
        });
      } else {
        console.error("File processing failed", message.error);
      }
    });

    worker.on("error", (error) => {
      console.error("Worker error", error);
    });

    worker.on("exit", async (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
        return;
      }
      //webhook
      updateStatus(requestId);
    });
    return res.status(200).json({
      success: true,
      data: requestId,
      message: "file is uploading",
    });
  } catch (error) {
    console.log("file upload error", error);
    return res.status(500).json({
      success: false,
      message: error.response.data.message,
    });
  }
});

//webhook
function updateStatus(id) {
  requestStatus[id] = { status: "complete" };
}

// status api
app.get("/status/:id", (req, res) => {
  try {
    const { id } = req.params;

    return res.status(200).json({
      success: true,
      data: requestStatus[id],
    });
  } catch (error) {
    console.log("error in fetching status");
    throw new Error(error.response.data.message);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
