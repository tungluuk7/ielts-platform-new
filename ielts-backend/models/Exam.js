import mongoose from "mongoose";

const ExamSchema = new mongoose.Schema({
  title: String,
  skill: String,
  duration: Number,
  audioUrl: String,
  sections: Array
}, { timestamps: true });

export default mongoose.model("Exam", ExamSchema);