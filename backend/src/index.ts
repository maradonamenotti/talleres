import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";
import ssoRoutes from './routes/sso';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', ssoRoutes);

app.get("/", (req, res) => {
  res.send("API de La Oficina del Entrenador en línea");
});

// Initialize and start server directly
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
