import sharp from "sharp";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME.toString(),
  api_key: process.env.CLOUDINARY_API_KEY.toString(),
  api_secret: process.env.CLOUDINARY_API_SECRET.toString(),
});

async function compressImages(imagePaths) {
  const compressedImages = [];

  for (let imgPath of imagePaths) {
    try {
      const imageResponse = await axios.get(imgPath, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(imageResponse.data);

      const image = sharp(buffer);
      const metadata = await image.metadata();
      const resizedBuffer = await image
        .resize(Math.round(metadata.width / 2))
        .webp()
        .toBuffer();

      const response = await uploadFilesToCloudinary(resizedBuffer);
      compressedImages.push(response.secure_url);
    } catch (error) {
      console.error(`Error processing image ${imgPath}:`, error.message);
    }
  }

  return compressedImages;
}

const uploadFilesToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream((error, uploadResult) => {
        if (error) {
          reject(error);
        } else {
          resolve(uploadResult);
        }
      })
      .end(buffer);
  });
};

export { compressImages };
