import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  serialNo: String,
  productName: String,
  images: [String],
  requestId: String,
});
const Product = mongoose.model("Product", ProductSchema);

export default Product;
