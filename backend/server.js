import express from "express";
import dotenv from "dotenv"


dotenv.config();

const app = express();


app.use(express.json());


app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running successfully ",
  });
});


app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
  });
});


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
