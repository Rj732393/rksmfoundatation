import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import legalRoutes from "./routes/legal.js";
import galleryRoutes from "./routes/gallery.js";
import peopleRoutes from "./routes/people.js";
import statsRoutes from "./routes/stats.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Behind Render/Railway's reverse proxy, req.secure and secure cookies
// need this to work correctly.
app.set("trust proxy", 1);

// The static site and this API are on different subdomains now, so CORS
// must allow credentials from that specific origin (wildcard "*" cannot
// be combined with credentials — the browser will reject it).
// Reads CORS_ORIGIN from .env — a comma-separated list, e.g.:
//   CORS_ORIGIN=http://localhost:5500,http://127.0.0.1:5500
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "https://rkshahifoundation.org")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);
console.log("CORS will allow:", JSON.stringify(ALLOWED_ORIGINS));
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: res => {
      res.setHeader("Cache-Control", "public, max-age=86400");
    }
  })
);

// ===== VISITOR COUNTER (must come BEFORE the /:folder catch-all) =====
import cookieParser from "cookie-parser";
app.use(cookieParser());

const counterFile = path.join(__dirname, "counter.json");

function readCounter() {
  try {
    return JSON.parse(fs.readFileSync(counterFile, "utf8")).count;
  } catch {
    fs.writeFileSync(counterFile, JSON.stringify({ count: 0 }, null, 2));
    return 0;
  }
}

function incrementCounter() {
  const count = readCounter() + 1;
  fs.writeFileSync(counterFile, JSON.stringify({ count }, null, 2));
  return count;
}

app.use((req, res, next) => {
  if (!req.cookies?.visited) {
    incrementCounter();
    res.cookie("visited", "yes", {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true
    });
  }
  next();
});

app.get("/counter", (req, res) => {
  res.json({ count: readCounter() });
});

// NOTE: the old "/:folder" catch-all that used to live here was removed —
// it was registered BEFORE express.static(__dirname) below, so it was
// swallowing every top-level static file request (header.html, footer.html,
// about.html, ...) and serving player.html instead. The one correctly-
// positioned copy (after all real routes, before the 404 handler) is kept.

// ===== VIDEO PLAYER SETUP =====

// SECURITY: __dirname contains .env, db.js, create-admin.js, and other
// files that must never be publicly downloadable. Do NOT use
// express.static(__dirname) — that serves the entire folder, secrets
// included, to anyone who requests the filename directly.
// This server only needs to hand out player.html (for the video routes
// below); index.html and the rest of the site are served by Apache.
app.get("/player.html", (req, res) => {
  res.sendFile(path.join(__dirname, "player.html"));
});

// Videos static folder
app.use("/videos", express.static(path.join(__dirname, "videos")));

// Video API
app.get("/api/video/:folder", (req, res) => {
  const folder = req.params.folder;
  const dir = path.join(__dirname, "videos", folder);

  if (!fs.existsSync(dir))
    return res.status(404).json({ error: "Folder not found" });

  const files = fs.readdirSync(dir).filter(f =>
    /\.(mp4|mov|mkv|webm)$/i.test(f)
  );

  if (files.length === 0)
    return res.status(404).json({ error: "Video not found" });

  res.json({
    videos: files.map(f => `/videos/${folder}/${f}`)
  });
});

// ===== EXISTING API ROUTES =====

app.use("/api/auth", authRoutes);
app.use("/api/legal", legalRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/people", peopleRoutes);
app.use("/api/stats", statsRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "RKSF API Running"
  });
});

// ===== VIDEO PLAYER CATCH-ALL (rakhna hai API routes ke BAAD, 404 se PEHLE) =====
app.get("/:folder", (req, res) => {
  res.sendFile(path.join(__dirname, "player.html"));
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found"
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});