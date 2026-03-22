import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Exam from "./models/Exam.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();

const app = express();

/* ==============================
   MIDDLEWARE
============================== */
app.use(cors());
app.use(express.json());

// 2. Cấu hình thông tin Cloudinary (Thay bằng thông tin thật của bạn)
// Khuyên dùng: Nên đưa 3 biến này vào file .env trên máy và trên Render
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 3. Cấu hình Storage đẩy thẳng lên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ielts_platform_uploads", // Tên thư mục sẽ tạo trên Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "webp", "mp3", "wav", "mpeg"], // Hỗ trợ cả ảnh và audio
    resource_type: "auto" // Tự động nhận diện ảnh hay audio
  },
});

const upload = multer({ storage: storage });

// 4. API Upload (Đã sửa đổi)
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Không có file nào được tải lên" });
  
  // Lúc này, req.file.path chính là cái URL tuyệt đối từ Cloudinary (https://res.cloudinary...)
  res.json({ url: req.file.path }); 
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