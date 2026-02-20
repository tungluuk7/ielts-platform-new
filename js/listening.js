// js/listening.js

export function renderListening(examData, materialPane, questionsPane, onAnswerUpdate) {
    if (!examData.sections || examData.sections.length === 0) {
        materialPane.innerHTML = '<p>Không có dữ liệu bài nghe.</p>';
        return;
    }

    // 1. Render Cột trái (Audio Player được ghim cố định)
    // Lưu ý: Dùng thuộc tính position: sticky để player luôn nổi trên cùng khi cuộn
    const audioSrc = examData.audioUrl || ''; 
    materialPane.innerHTML = `
        <div class="audio-container" style="position: sticky; top: 0; background: var(--container-bg); padding-bottom: 20px; z-index: 10;">
            <h3 style="margin-bottom: 15px;">Audio Player</h3>
            ${audioSrc 
                ? `<audio id="ielts-audio" controls style="width: 100%; border-radius: var(--radius);">
                    <source src="${audioSrc}" type="audio/mpeg">
                    Trình duyệt của bạn không hỗ trợ thẻ audio.
                   </audio>` 
                : `<div class="audio-placeholder">[Audio URL chưa được cấu hình trong JSON]</div>`
            }
            <div style="margin-top: 20px; padding: 15px; background-color: var(--bg-color); border-radius: var(--radius);">
                <p style="margin-bottom: 10px;"><strong>Lưu ý:</strong></p>
                <ul style="padding-left: 20px;">
                    <li>Kiểm tra âm lượng tai nghe trước khi nhấn Play.</li>
                    <li>Audio sẽ chạy xuyên suốt từ Part 1 đến Part 4.</li>
                    <li>Bạn không thể dừng lại (Pause) trong kỳ thi thật.</li>
                </ul>
            </div>
        </div>
    `;

    // 2. Render Cột phải (Câu hỏi cuộn liên tục từ Part 1 -> 4)
    let questionsHTML = '';
    
    examData.sections.forEach((section, idx) => {
        questionsHTML += `
            <div class="listening-part" id="part-${idx + 1}" style="margin-bottom: 50px;">
                <h2 style="border-bottom: 2px solid var(--primary-color); padding-bottom: 10px; margin-bottom: 20px; color: var(--primary-color);">
                    ${section.title}
                </h2>
        `;

        section.questionGroups.forEach(group => {
            questionsHTML += `
                <div class="question-group">
                    <div class="group-instruction"><strong>Hướng dẫn:</strong> ${group.instruction}</div>
                    <div class="group-questions">
                        ${renderQuestionsByType(group)}
                    </div>
                </div>
                <hr style="margin: 20px 0; border: none; border-top: 1px dashed var(--border-color);">
            `;
        });

        questionsHTML += `</div>`; // Đóng listening-part
    });

    questionsPane.innerHTML = questionsHTML;

    // 3. Gắn sự kiện (Lắng nghe thay đổi đáp án)
    attachEvents();
    restoreAnswers(examData.sections);
}

// --- Thay thế hàm renderQuestionsByType ---
function renderQuestionsByType(group) {
    let html = '';

    if (group.type === 'NOTES_COMPLETION') {
        let notesHTML = group.content;
        group.questions.forEach(q => {
            const inputHTML = `<span id="question-${q.number}" class="question-item" style="display:inline-block; padding:0; margin:0; border:none;"><input type="text" class="gap-fill-input" name="q_${q.number}" data-qnum="${q.number}" placeholder="${q.number}. ..."></span>`;
            notesHTML = notesHTML.replace(`[[${q.number}]]`, inputHTML);
        });
        return `<div class="notes-completion-box" style="background-color: var(--bg-color); padding: 24px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); line-height: 1.9; font-size: 16px;">${notesHTML}</div>`;
    }

    if (group.type === 'MATCHING') {
        // Lấy danh sách options từ câu hỏi đầu tiên (Admin nhập A, B, C... vào ô đáp án nhiễu)
        const options = group.questions[0].options || [];
        
        html += `<div class="matching-container" data-group-id="${group.questions[0].number}">
            <div class="match-col left-col">`;
        // Cột trái: Câu hỏi
        group.questions.forEach((q, idx) => {
            html += `<div class="match-item left-item" id="question-${q.number}" data-qnum="${q.number}" data-color-idx="${(idx % 6) + 1}">
                <span class="question-number">${q.number}.</span> ${q.text}
            </div>`;
        });
        html += `</div><div class="match-col right-col">`;
        // Cột phải: Options
        options.forEach((opt, idx) => {
            html += `<div class="match-item right-item" data-opt="${opt}">${opt}</div>`;
        });
        html += `</div></div>`;
        return html;
    }

    // Các dạng cơ bản (TFNG, MC, GAP_FILL)
    group.questions.forEach(q => {
        html += `<div class="question-item" id="question-${q.number}">`;
        html += `<span class="question-number">${q.number}.</span> `;

        switch (group.type) {
            case 'TFNG':
            case 'MULTIPLE_CHOICE':
                html += `<span class="question-text">${q.text}</span><div class="options-container">`;
                q.options.forEach(opt => {
                    html += `<label class="radio-label"><input type="radio" name="q_${q.number}" value="${opt}" data-qnum="${q.number}"> ${opt}</label>`;
                });
                html += `</div>`;
                break;
            case 'GAP_FILL':
                html += `<span class="question-text">${q.text.replace('___', `<input type="text" class="gap-fill-input" name="q_${q.number}" data-qnum="${q.number}" placeholder="...">`)}</span>`;
                break;
        }
        html += `</div>`;
    });
    return html;
}

// --- Hàm xử lý sự kiện ---
function attachEvents() {
    const questionsPane = document.getElementById('exam-questions-pane');
    
    // Radio button (Multiple Choice)
    questionsPane.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const qNum = e.target.getAttribute('data-qnum');
            const val = e.target.value;
            window.examAnswerSheet[qNum] = val;
            
            // Dispatch custom event hoặc gọi trực tiếp callback để update Palette
            const event = new CustomEvent('answerUpdated', { detail: { qNum, status: 'answered' } });
            document.dispatchEvent(event);
        });
    });

    // Text input (Gap Fill)
    questionsPane.querySelectorAll('.gap-fill-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const qNum = e.target.getAttribute('data-qnum');
            const val = e.target.value.trim();
            
            if (val !== '') {
                window.examAnswerSheet[qNum] = val;
                const event = new CustomEvent('answerUpdated', { detail: { qNum, status: 'answered' } });
                document.dispatchEvent(event);
            } else {
                delete window.examAnswerSheet[qNum];
                const event = new CustomEvent('answerUpdated', { detail: { qNum, status: 'unanswered' } });
                document.dispatchEvent(event);
            }
        });
    });
    // --- Logic Nối Matching ---
        const matchingContainers = questionsPane.querySelectorAll('.matching-container');
        matchingContainers.forEach(container => {
            let activeLeft = null;
            const leftItems = container.querySelectorAll('.left-item');
            const rightItems = container.querySelectorAll('.right-item');

            leftItems.forEach(left => {
                left.addEventListener('click', () => {
                    // Xóa trạng thái active cũ
                    leftItems.forEach(l => l.classList.remove('active'));
                    activeLeft = left;
                    left.classList.add('active');
                });
            });

            rightItems.forEach(right => {
                right.addEventListener('click', () => {
                    if (!activeLeft) return; // Phải chọn vế trái trước

                    const qNum = activeLeft.getAttribute('data-qnum');
                    const colorIdx = activeLeft.getAttribute('data-color-idx');
                    const optValue = right.getAttribute('data-opt');

                    // Kiểm tra xem Right này đã bị ai chiếm chưa
                    const isOccupied = Array.from(right.classList).some(c => c.startsWith('match-pair-'));
                    if (isOccupied) return; // Nếu bị chiếm, không cho chọn

                    // Xóa liên kết cũ của Left (nếu có)
                    rightItems.forEach(r => {
                        if (r.getAttribute('data-linked-to') === qNum) {
                            r.className = 'match-item right-item'; // Reset CSS
                            r.removeAttribute('data-linked-to');
                        }
                    });

                    // Nối Left và Right
                    const colorClass = `match-pair-${colorIdx}`;
                    activeLeft.className = `match-item left-item ${colorClass}`;
                    right.className = `match-item right-item ${colorClass}`;
                    right.setAttribute('data-linked-to', qNum);

                    // Lưu vào AnswerSheet và cập nhật Palette
                    window.examAnswerSheet[qNum] = optValue;
                    onAnswerUpdate(qNum, 'answered');

                    activeLeft = null; // Reset
                });
            });
        });
}

    // --- Thay thế hàm restoreAnswers ---
function restoreAnswers(section) {
    // Lưu ý: Đối với listening.js, tham số truyền vào hàm này là mảng sections, 
    // bạn điều chỉnh lại vòng lặp cho phù hợp (hoặc thay luôn đoạn code khôi phục bên dưới)
    const groups = section.questionGroups || []; // Hỗ trợ cả reading và mảng của listening
    groups.forEach(group => {
        group.questions.forEach(q => {
            const savedAnswer = window.examAnswerSheet[q.number];
            if (savedAnswer) {
                if (group.type === 'TFNG' || group.type === 'MULTIPLE_CHOICE') {
                    // Dùng class hoặc thuộc tính để tìm radio button
                    const radios = document.querySelectorAll(`input[name="q_${q.number}"]`);
                    radios.forEach(radio => { if(radio.value === savedAnswer) radio.checked = true; });
                } else if (group.type === 'GAP_FILL' || group.type === 'NOTES_COMPLETION') {
                    const input = document.querySelector(`input[name="q_${q.number}"]`);
                    if (input) input.value = savedAnswer;
                }
            }
        });
    });
}