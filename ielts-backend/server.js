import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Exam from "./models/Exam.js";

dotenv.config();

const app = express();

/* ==============================
   MIDDLEWARE
============================== */
app.use(cors());
app.use(express.json());

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Lấy thư mục gốc (Fix cho ES Module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Cấu hình Multer để lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất tránh trùng lặp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Mở public thư mục uploads để Frontend xem được ảnh/audio
app.use("/uploads", express.static(uploadDir));

// API Upload File
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Không có file nào được tải lên" });
  
  // Trả về đường dẫn của file vừa lưu
  // Ví dụ: /uploads/17099...-chart.png
  res.json({ url: `/uploads/${req.file.filename}` }); 
});

/* ==============================
   CONNECT DATABASE
============================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

/* ==============================
   ROUTES
============================== */

/* ===== LẤY TẤT CẢ ĐỀ ===== */
app.get("/api/exams", async (req, res) => {
  try {
    const exams = await Exam.find();

    // 🔥 Map _id → id để frontend dùng như cũ
    const formatted = exams.map(e => ({
      ...e.toObject(),
      id: e._id.toString()
    }));

    res.json(formatted);
  } catch (err) {
  console.error("🔥 ERROR:", err);
  res.status(500).json({ error: err.message });
}
});

/* ===== LẤY 1 ĐỀ ===== */
app.get("/api/exams/:id", async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam)
      return res.status(404).json({ message: "Exam not found" });

    const formatted = {
      ...exam.toObject(),
      id: exam._id.toString()
    };

    res.json(formatted);
  } catch (err) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

/* ===== TẠO ĐỀ ===== */
app.post("/api/exams", async (req, res) => {
  try {
    const newExam = new Exam(req.body);
    await newExam.save();

    const formatted = {
      ...newExam.toObject(),
      id: newExam._id.toString()
    };

    res.json(formatted);
  } catch (err) {
    res.status(400).json({ error: "Cannot create exam" });
  }
});

/* ===== XÓA ĐỀ ===== */
app.delete("/api/exams/:id", async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Delete failed" });
  }
});

/* ==============================
   START SERVER
============================== */
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/grade-writing", async (req, res) => {
  try {
    const { essay, taskType } = req.body;

    const prompt = `
You are an IELTS Writing examiner.

Evaluate the following IELTS ${taskType} essay.

Give:
- Overall Band Score
- Task Response
- Coherence & Cohesion
- Lexical Resource
- Grammatical Range & Accuracy
- Detailed feedback

Essay:
${essay}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    res.json({ result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Grading failed" });
  }
});