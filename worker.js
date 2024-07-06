import fs from "fs";
import csv from "csv-parser";
import { compressImages } from "./utils/compressImages.js";
import Product from "./model/Product.js";
import { workerData, parentPort } from "worker_threads";
import axios from "axios";
const { filePath, requestId } = workerData;

async function process() {
  let results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      for (let row of results) {
        let images = row.Images.split(",").map((img) => img.trim());

        let compressedImages = await compressImages(images);

        parentPort.postMessage({
          success: true,
          data: {
            serialNo: row["S.No"],
            productName: row["Product"],
            images: [...compressedImages],
          },
        });
      }
      //webhook

      fs.unlinkSync(filePath);

      // sending message to main thread
    })
    .on("error", (error) => {
      console.log("error in reading file");
      parentPort.postMessage({ success: false, error: error.message });
    });
}
process();
