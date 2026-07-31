import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/api.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use("/api", apiRoutes);
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Metadata server listening on :${PORT}`));
