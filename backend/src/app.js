import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketmanager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";
const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.use(cors());
app.use(express.json());

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" })); // Increase the limit for JSON payloads
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use("/api/v1/users", userRoutes);

const start = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://chaudharishruti0721_zoom:shruti2005@cluster0.zxeit7i.mongodb.net/apna_vdo_call"
    );

    console.log("✅ Database connected");
    console.log("📦 Host:", mongoose.connection.host);

    server.listen(app.get("port"), () => {
      console.log(`🚀 Server running on port ${app.get("port")}`);
    });
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  }
};

start();
