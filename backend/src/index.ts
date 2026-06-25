import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { AppDataSource } from "./data-source";

// Middleware
import { authenticateJWT, requireRole } from "./modules/auth/jwt.middleware";

// Controllers
import { handleSSO, login, getCourses, addCourse, deleteCourse } from "./modules/auth/auth.controller";
import { getProfile, getAllUsers, updateRole, banUser, deleteUser, adminCreateUser, adminUpdateUser } from "./modules/users/users.controller";
import { getMyCase, getAllCases, saveCase, evaluateCase, getApprovedCases } from "./modules/tactical-cases/tactical-cases.controller";
import { getActiveRooms, createRoom, getMyRegistrations, registerRoom, unregisterRoom, deleteRoom } from "./modules/meet-rooms/meet-rooms.controller";
import { getAccessLogs, getMoodleStatus } from "./modules/stats/stats.controller";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Auth Routes
app.post("/api/auth/sso", handleSSO);
app.post("/api/auth/login", login);
app.get("/api/auth/courses", authenticateJWT, requireRole(["admin"]), getCourses);
app.post("/api/auth/courses", authenticateJWT, requireRole(["admin"]), addCourse);
app.delete("/api/auth/courses/:id", authenticateJWT, requireRole(["admin"]), deleteCourse);

// Users Routes
app.post("/api/users", authenticateJWT, requireRole(["admin"]), adminCreateUser);
app.get("/api/users/profile", authenticateJWT, getProfile);
app.get("/api/users", authenticateJWT, requireRole(["admin"]), getAllUsers);
app.put("/api/users/:id/role", authenticateJWT, requireRole(["admin"]), updateRole);
app.put("/api/users/:id/ban", authenticateJWT, requireRole(["admin"]), banUser);
app.put("/api/users/:id", authenticateJWT, requireRole(["admin"]), adminUpdateUser);
app.delete("/api/users/:id", authenticateJWT, requireRole(["admin"]), deleteUser);

// Tactical Cases Routes
app.get("/api/tactical-cases/my-case", authenticateJWT, getMyCase);
app.get("/api/tactical-cases/approved", authenticateJWT, getApprovedCases);
app.get("/api/tactical-cases", authenticateJWT, requireRole(["teacher", "admin"]), getAllCases);
app.post("/api/tactical-cases", authenticateJWT, saveCase);
app.put("/api/tactical-cases/:id/evaluate", authenticateJWT, requireRole(["teacher", "admin"]), evaluateCase);

// Meet Rooms Routes
app.get("/api/meet-rooms", authenticateJWT, getActiveRooms);
app.post("/api/meet-rooms", authenticateJWT, requireRole(["teacher", "admin"]), createRoom);
app.delete("/api/meet-rooms/:id", authenticateJWT, requireRole(["teacher", "admin"]), deleteRoom);
app.get("/api/meet-rooms/registrations", authenticateJWT, getMyRegistrations);
app.post("/api/meet-rooms/:id/register", authenticateJWT, registerRoom);
app.delete("/api/meet-rooms/:id/register", authenticateJWT, unregisterRoom);

// Stats Routes
app.get("/api/stats/access-logs", authenticateJWT, requireRole(["admin"]), getAccessLogs);
app.get("/api/stats/moodle-status", authenticateJWT, getMoodleStatus);

// Health check
app.get("/", (req, res) => {
  res.send("API de La Oficina del Entrenador en línea (Módulos TypeORM)");
});

// Initialize DB and start server
AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
