// js/reading.js

export function renderReading(examData, materialPane, questionsPane, onAnswerUpdate) {
    if (!examData.sections || examData.sections.length === 0) {
        materialPane.innerHTML = '<p>Không có dữ liệu bài đọc.</p>';
        return;
    }

    let currentSectionIndex = 0;

    // --- Hàm render giao diện chính ---
    function render() {
        const section = examData.sections[currentSectionIndex];
        
        // 1. Render Cột trái (Ngữ liệu)
        materialPane.innerHTML = `
            <div class="passage-tabs">
                ${examData.sections.map((sec, idx) => `
                    <button class="tab-btn ${idx === currentSectionIndex ? 'active' : ''}" data-index="${idx}">
                        Passage ${idx + 1}
                    </button>
                `).join('')}
            </div>
            <div class="passage-content">
                <h3 style="margin-top: 15px;">${section.title}</h3>
                <div class="passage-text">${section.content}</div>
            </div>
        `;

        // 2. Render Cột phải (Câu hỏi)
        let questionsHTML = '';
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

        questionsPane.innerHTML = `
            <h3 style="margin-bottom: 15px;">Questions for ${section.title}</h3>
            ${questionsHTML}
        `;

        // 3. Gắn sự kiện (Event Listeners)
        attachEvents();
        restoreAnswers(section); // Phục hồi đáp án nếu đã làm rồi quay lại
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
        // Chuyển tab passage
        materialPane.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentSectionIndex = parseInt(e.target.getAttribute('data-index'));
                render();
                questionsPane.scrollTo(0, 0);
                materialPane.scrollTo(0, 0);
            });
        });

        // Lắng nghe thay đổi đáp án (Radio)
        questionsPane.querySelectorAll('input[type="radio"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const qNum = e.target.getAttribute('data-qnum');
                const val = e.target.value;
                window.examAnswerSheet[qNum] = val; // Lưu vào biến toàn cục của bài thi
                onAnswerUpdate(qNum, 'answered'); // Cập nhật Palette
            });
        });

        // Lắng nghe thay đổi đáp án (Text input)
        questionsPane.querySelectorAll('.gap-fill-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const qNum = e.target.getAttribute('data-qnum');
                const val = e.target.value.trim();
                
                if (val !== '') {
                    window.examAnswerSheet[qNum] = val;
                    onAnswerUpdate(qNum, 'answered');
                } else {
                    delete window.examAnswerSheet[qNum];
                    onAnswerUpdate(qNum, 'unanswered');
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

    // Khởi chạy render lần đầu
    render();
}