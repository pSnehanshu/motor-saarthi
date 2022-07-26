import "dotenv/config";
import "reflect-metadata";
import express from "express";

const isProduction = process.env.NODE_ENV === "production";

const app = express();

const port = process.env.PORT || 4080;
app.listen(port, () => console.log("MotorSaarthi is running on port", port));
