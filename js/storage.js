const API_URL = "https://ielts-platform-new.onrender.com/api";

/* =========================
   LẤY TẤT CẢ ĐỀ
========================= */
export async function getAllExams() {
  const res = await fetch(`${API_URL}/exams`);
  return await res.json();
}

/* =========================
   LẤY 1 ĐỀ THEO ID
========================= */
export async function getExamById(id) {
  const res = await fetch(`${API_URL}/exams/${id}`);
  return await res.json();
}

/* =========================
   TẠO ĐỀ MỚI
========================= */
export async function saveExam(examData) {
  const res = await fetch(`${API_URL}/exams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(examData)
  });

  return await res.json();
}

/* =========================
   XÓA ĐỀ
========================= */
export async function deleteExam(id) {
  await fetch(`${API_URL}/exams/${id}`, {
    method: "DELETE"
  });
}