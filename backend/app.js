import express from "express";
import authRoutes from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();


app.use(express.json());

app.use(cookieParser());

app.use("/api/auth", authRoutes)

app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true,             
}));

app.get("/", (req, res) => {
  res.json({ message: "App is running " });
});

export default app;
