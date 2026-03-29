// js/examEngine.js

import { getExamById } from './storage.js';
import { renderReading } from './reading.js'; 
import { renderListening } from './listening.js'; // <-- Thêm dòng này
import { renderWriting } from './writing.js';
import { renderSpeaking } from './speaking.js';

window.examTimerInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');
    

    if (!examId) {
        alert("Không tìm thấy ID đề thi hợp lệ.");
        window.location.href = '../student/index.html';
        return;
    }

    const examData = await getExamById(examId);
    if (!examData) {
        alert("Đề thi không tồn tại trong hệ thống.");
        window.location.href = '../student/index.html';
        return;
    }

    // 1. Cập nhật tiêu đề
    document.getElementById('exam-title').textContent = examData.title;
    
    // 2. Khởi động đồng hồ
    initTimer(examData.duration);
    
    // 3. Khởi tạo đối tượng lưu trữ bài làm
    window.examAnswerSheet = {}; 
    const backToId = urlParams.get('backTo');
    if (backToId) {
        const exitBtn = document.querySelector('button[onclick*="index.html"]');
        if (exitBtn) {
            exitBtn.textContent = "Quay lại Full Test";
            exitBtn.onclick = (e) => {
                e.preventDefault();
                window.location.href = `../student/index.html?id=${backToId}`;
            };
        }
    }

    // 4. Lấy DOM vùng làm bài
    const materialPane = document.getElementById('exam-material-pane');
    const questionsPane = document.getElementById('exam-questions-pane');

    // 5. Phân luồng kỹ năng
    switch (examData.skill) {
        case 'reading':
            initQuestionPalette(40);
            renderReading(examData, materialPane, questionsPane, updatePaletteStatus);
            break;
        case 'listening':
            initQuestionPalette(40);
            renderListening(examData, materialPane, questionsPane, updatePaletteStatus);
            break;
        case 'writing':
            initQuestionPalette(0);
            renderWriting(examData, materialPane, questionsPane, updatePaletteStatus);
            break;
        case 'speaking':
            initQuestionPalette(0);
            renderSpeaking(examData, materialPane, questionsPane);
            break;
        case 'full':
            // Xử lý giao diện Full Test Hub
            document.getElementById('countdown').style.display = 'none'; // Ẩn timer tổng
            document.getElementById('btn-submit-exam').style.display = 'none'; // Ẩn nút nộp bài tổng
            initQuestionPalette(0); 
            renderFullTestHub(examData, materialPane, questionsPane);
            break;
        default:
            materialPane.innerHTML = '<p>Kỹ năng không được hỗ trợ.</p>';
    }

    // 6. Sự kiện nộp bài
    document.getElementById('btn-submit-exam').addEventListener('click', () => {
        if(confirm("Bạn có chắc chắn muốn nộp bài?")) {
            submitExam();
        }
    });
});

// ================= CÁC HÀM TIỆN ÍCH =================
// Lắng nghe sự kiện cập nhật đáp án từ các module con (Listening, Reading...)
    document.addEventListener('answerUpdated', (e) => {
        updatePaletteStatus(e.detail.qNum, e.detail.status);
    });
// Sửa lại hàm initTimer để lưu vào biến toàn cục
function initTimer(seconds) {
    let timeLeft = seconds;
    const countdownEl = document.getElementById('countdown');

    const updateDisplay = (time) => {
        const h = Math.floor(time / 3600).toString().padStart(2, '0');
        const m = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
        const s = (time % 60).toString().padStart(2, '0');
        countdownEl.textContent = `${h}:${m}:${s}`;
    };

    updateDisplay(timeLeft);

    window.examTimerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(window.examTimerInterval);
            countdownEl.textContent = "00:00:00";
            alert("Hết giờ làm bài! Hệ thống sẽ tự động nộp bài.");
            submitExam();
            return;
        }
        timeLeft--;
        updateDisplay(timeLeft);
    }, 1000);
}

// Hàm render danh sách câu hỏi bên phải (Palette)
function initQuestionPalette(totalQuestions) {
    const paletteGrid = document.getElementById('question-palette');
    paletteGrid.innerHTML = '';
    
    if(totalQuestions === 0) {
        paletteGrid.innerHTML = '<p style="text-align:center; color: var(--text-muted); grid-column: 1/-1;">Not Applicable</p>';
        return;
    }

    for (let i = 1; i <= totalQuestions; i++) {
        const btn = document.createElement('button');
        btn.className = 'palette-btn unanswered';
        btn.textContent = i;
        btn.id = `palette-btn-${i}`;
        
        btn.addEventListener('click', () => {
            const qElement = document.getElementById(`question-${i}`);
            if (qElement) {
                // Scroll mượt
                qElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Kích hoạt CSS Animation Highlight
                qElement.classList.remove('highlight-active');
                void qElement.offsetWidth; // Kỹ thuật Trigger Reflow để reset animation
                qElement.classList.add('highlight-active');
            }
        });
        
        paletteGrid.appendChild(btn);
    }
}

// Hàm export để cập nhật màu Palette và thanh Progress
export function updatePaletteStatus(questionNumber, status) {
    const btn = document.getElementById(`palette-btn-${questionNumber}`);
    if (btn) {
        btn.className = `palette-btn ${status}`;
    }

    // Logic tính toán Progress Bar trên Top Header
    const totalQuestions = document.querySelectorAll('.palette-btn').length;
    if (totalQuestions > 0) {
        const answeredQuestions = document.querySelectorAll('.palette-btn.answered').length;
        const progressPercentage = (answeredQuestions / totalQuestions) * 100;
        const progressBar = document.getElementById('exam-progress');
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
        }
    }
}

// --- Hàm phụ gọi API AI (Gọi qua Backend an toàn 100%) ---
async function gradeWritingWithAI(promptText, essayText, apiKey) {
    // Đổi URL này trỏ về đúng Backend đang chạy trên Render của bạn
    const API_URL = "https://ielts-platform-new.onrender.com/api/grade-writing"; 
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskType: promptText,
                essay: essayText,
                apiKey: apiKey // Đẩy key Admin đã nhập lên Backend xử lý
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Lỗi server: ${response.status}`);
        }
        
        // Backend đã xử lý JSON sạch sẽ, chỉ việc nhận và dùng
        const data = await response.json();
        return data; 

    } catch (error) {
        console.error("AI Evaluation Catch Error:", error);
        return null;
    }
}

// --- THÊM 2 BIẾN TOÀN CỤC ĐỂ LƯU TRẠNG THÁI ---
window.isExamSubmitted = false;
window.currentExamData = null;

// Lắng nghe sự kiện chuyển tab từ reading.js
document.addEventListener('examTabChanged', () => {
    if (window.isExamSubmitted) {
        drawGradingUI(); // Vẽ lại đáp án cho Tab mới
    }
});

// Hàm khóa input dùng chung
function disableAllInputs() {
    document.querySelectorAll('input, textarea, .match-item').forEach(el => {
        el.style.pointerEvents = 'none';
        if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.disabled = true;
    });
}

// --- CẬP NHẬT HÀM SUBMIT EXAM ---
async function submitExam() {
    if (window.examTimerInterval) clearInterval(window.examTimerInterval);
    
    const btnSubmit = document.getElementById('btn-submit-exam');
    const urlParams = new URLSearchParams(window.location.search);
    const examData = await getExamById(urlParams.get('id')); 
    if(!examData) return;

    // Lưu trạng thái nộp bài
    window.isExamSubmitted = true;
    window.currentExamData = examData;
    disableAllInputs();

    // 1. CHẤM BÀI READING & LISTENING
    if (examData.skill === 'reading' || examData.skill === 'listening') {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Đã nộp bài";
        btnSubmit.style.backgroundColor = "var(--text-muted)";

        let totalQuestions = 0;
        let correctAnswersCount = 0;

        // BƯỚC A: TÍNH ĐIỂM TRƯỚC (Quét toàn bộ json, không phụ thuộc vào giao diện)
        examData.sections.forEach(section => {
            section.questionGroups.forEach(group => {
                group.questions.forEach(q => {
                    totalQuestions++;
                    const studentAnswer = (window.examAnswerSheet[q.number] || '').toString().trim().toLowerCase();
                    const rawCorrectAnswer = (q.correctAnswer || '').toString().trim().toLowerCase();
                    
                    // TÁCH MẢNG ĐÁP ÁN BẰNG ~/
                    const acceptedAnswers = rawCorrectAnswer.split('~/').map(ans => ans.trim()).filter(ans => ans !== '');
                    
                    // NẾU CÂU TRẢ LỜI CỦA HS NẰM TRONG MẢNG CHẤP NHẬN ĐƯỢC -> CỘNG ĐIỂM
                    if (acceptedAnswers.includes(studentAnswer) && acceptedAnswers.length > 0) {
                        correctAnswersCount++;
                    }
                });
            });
        });

        // Hiển thị điểm số lên góc trên cùng
        const titleEl = document.getElementById('exam-title');
        titleEl.innerHTML = `${examData.title} <span style="margin-left:20px; color:var(--success-color); font-weight:900; background:var(--bg-color); padding:4px 12px; border-radius:20px; border:2px solid var(--success-color);">Điểm: ${correctAnswersCount} / ${totalQuestions}</span>`;

        // BƯỚC B: VẼ ĐÁP ÁN CHO TAB HIỆN TẠI
        drawGradingUI();
    } 
    
    // 2. CHẤM BÀI WRITING BẰNG AI (Phần này giữ nguyên của bạn)
    else if (examData.skill === 'writing') {
        // ... (Bạn copy lại logic chấm AI cũ của bạn dán vào đây để không bị mất code nhé) ...
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Đã nộp bài (Chờ GV chấm)";
            alert("Bài làm đã được thu. Tính năng tự động chấm bị tắt do chưa cấu hình API Key trong Admin.");
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = "AI đang chấm điểm...";
        btnSubmit.className = "btn btn-primary btn-grading";

        // Khóa các tab bên trái
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5';
        });

        const rightPane = document.getElementById('exam-questions-pane');
        rightPane.innerHTML = `<h3 style="margin-bottom: 24px; color: #8b5cf6;">✨ Kết quả Đánh giá từ AI</h3>`;

        for (const section of examData.sections) {
            const studentEssay = window.examAnswerSheet[`task_${section.sectionId}`] || "";
            const promptText = section.content.replace(/<[^>]*>?/gm, ''); 

            const taskContainer = document.createElement('div');
            taskContainer.style.marginBottom = '40px';
            taskContainer.innerHTML = `
                <h4 style="font-size: 18px; margin-bottom: 12px;">${section.title}</h4>
                <div style="background: var(--bg-color); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 16px; border-left: 4px solid var(--border-color); max-height: 200px; overflow-y: auto;">
                    <strong style="color: var(--text-muted);">Bài làm của bạn:</strong><br><br>
                    ${studentEssay ? studentEssay.replace(/\n/g, '<br>') : '<span style="color:#ef4444; font-style:italic;">Chưa làm bài</span>'}
                </div>
            `;
            rightPane.appendChild(taskContainer);

            if (!studentEssay || studentEssay.trim().split(/\s+/).length < 20) {
                const errorCard = document.createElement('div');
                errorCard.className = 'ai-feedback-card';
                errorCard.innerHTML = `<p style="color: #ef4444; font-weight: bold;">Không thể chấm điểm: Bài viết quá ngắn (dưới 20 từ) hoặc chưa hoàn thành.</p>`;
                taskContainer.appendChild(errorCard);
                continue;
            }

            const evaluation = await gradeWritingWithAI(promptText, studentEssay, apiKey);

            if (evaluation) {
                const feedbackCard = document.createElement('div');
                feedbackCard.className = 'ai-feedback-card';
                feedbackCard.innerHTML = `
                    <div class="ai-header">
                        <div class="ai-title">Nhận xét từ AI Examiner</div>
                        <div class="ai-score-badge">Band ${evaluation.overall}</div>
                    </div>
                    <div class="ai-criteria-grid">
                        <div class="ai-criteria-item">
                            <div class="ai-criteria-name">Task Response</div>
                            <div class="ai-criteria-score">${evaluation.ta}</div>
                        </div>
                        <div class="ai-criteria-item">
                            <div class="ai-criteria-name">Coherence</div>
                            <div class="ai-criteria-score">${evaluation.cc}</div>
                        </div>
                        <div class="ai-criteria-item">
                            <div class="ai-criteria-name">Lexical</div>
                            <div class="ai-criteria-score">${evaluation.lr}</div>
                        </div>
                        <div class="ai-criteria-item">
                            <div class="ai-criteria-name">Grammar</div>
                            <div class="ai-criteria-score">${evaluation.gra}</div>
                        </div>
                    </div>
                    <div class="ai-feedback-text">${evaluation.feedback}</div>
                `;
                taskContainer.appendChild(feedbackCard);
            } else {
                const errorCard = document.createElement('div');
                errorCard.className = 'ai-feedback-card';
                errorCard.innerHTML = `<p style="color: #ef4444; font-weight: bold;">Có lỗi xảy ra khi AI phân tích bài viết. Hãy thử lại sau.</p>`;
                taskContainer.appendChild(errorCard);
            }
        }

        btnSubmit.textContent = "Đã hoàn tất chấm điểm";
        btnSubmit.className = "btn btn-primary";
        btnSubmit.style.backgroundColor = "var(--success-color)";
    }
    else {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Đã nộp bài";
        alert("Bài thi Speaking đã được ghi nhận. Dạng bài này hiện tại cần giáo viên đánh giá trực tiếp.");
    }
}

// --- HÀM MỚI TẠO: CHỈ CHỊU TRÁCH NHIỆM VẼ ĐÁP ÁN ---
function drawGradingUI() {
    if (!window.currentExamData) return;

    disableAllInputs(); // Khóa input

    window.currentExamData.sections.forEach(section => {
        section.questionGroups.forEach(group => {
            group.questions.forEach(q => {
                const qElement = document.getElementById(`question-${q.number}`);
                if (!qElement) return; 

                qElement.querySelectorAll('.result-text, .correct-answer-show').forEach(el => el.remove());

                const studentAnswer = (window.examAnswerSheet[q.number] || '').toString().trim().toLowerCase();
                const rawCorrectAnswer = (q.correctAnswer || '').toString().trim().toLowerCase();
                
                // TÁCH MẢNG ĐÁP ÁN
                const acceptedAnswers = rawCorrectAnswer.split('~/').map(ans => ans.trim()).filter(ans => ans !== '');
                let isCorrect = acceptedAnswers.includes(studentAnswer) && acceptedAnswers.length > 0;

                // Chuỗi hiển thị đáp án đẹp mắt (thay ~/ bằng chữ "hoặc")
                const displayCorrectAnswer = q.correctAnswer ? q.correctAnswer.split('~/').map(a => a.trim()).join(' hoặc ') : '';

                const resultSpan = document.createElement('span');
                resultSpan.className = isCorrect ? 'result-text result-correct' : 'result-text result-wrong';
                resultSpan.textContent = isCorrect ? '✔ Đúng' : '✘ Sai';

                if (group.type === 'NOTES_COMPLETION' || group.type === 'GAP_FILL') {
                    const inputEl = document.querySelector(`input[name="q_${q.number}"]`);
                    if (inputEl) {
                        inputEl.insertAdjacentElement('afterend', resultSpan);
                        if (!isCorrect && q.correctAnswer) {
                            const correctSpan = document.createElement('span');
                            correctSpan.className = 'correct-answer-show'; 
                            correctSpan.style.color = '#166534';
                            correctSpan.style.fontWeight = 'bold';
                            correctSpan.style.marginLeft = '8px';
                            // Hiển thị biến thể thân thiện
                            correctSpan.textContent = `(Đáp án: ${displayCorrectAnswer})`; 
                            inputEl.insertAdjacentElement('afterend', correctSpan);
                        }
                    }
                } else if (group.type === 'MATCHING') {
                    qElement.appendChild(resultSpan);
                    if (!isCorrect && q.correctAnswer) {
                        const correctSpan = document.createElement('div');
                        correctSpan.className = 'correct-answer-show';
                        correctSpan.style.marginTop = '5px';
                        correctSpan.textContent = `Nối đúng: ${displayCorrectAnswer}`;
                        qElement.appendChild(correctSpan);
                    }
                } else {
                    const qText = qElement.querySelector('.question-text') || qElement;
                    qText.appendChild(resultSpan);
                    if (q.correctAnswer) {
                        const radios = qElement.querySelectorAll(`input[type="radio"]`);
                        radios.forEach(radio => {
                            // Highlight NẾU radio thuộc MỘT TRONG CÁC biến thể đáp án đúng
                            if (acceptedAnswers.includes(radio.value.trim().toLowerCase())) {
                                radio.parentElement.style.backgroundColor = '#dcfce7';
                                radio.parentElement.style.border = '1px solid #22c55e';
                                radio.parentElement.style.borderRadius = '4px';
                                radio.parentElement.style.padding = '4px 8px';
                                radio.parentElement.style.display = 'inline-block';
                            }
                        });
                    }
                }
            });
        });
    });
}