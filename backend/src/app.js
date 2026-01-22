// server.js (or index.js)
import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import { connectToSocket } from "./controllers/socketmanager.js";
import userRoutes from "./routes/users.routes.js";

// Load environment variables from .env
dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server); // initialize socket.io

// Middlewares
app.use(cors());
app.use(express.json({ limit: "40kb" })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Routes
app.use("/api/v1/users", userRoutes);

// Port
const PORT = process.env.PORT || 8000;

// Start server and connect to MongoDB
const start = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database connected");
    console.log("📦 Host:", mongoose.connection.host);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  }
};

start();
