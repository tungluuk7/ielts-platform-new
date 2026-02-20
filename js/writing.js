// js/writing.js

export function renderWriting(examData, materialPane, questionsPane, onAnswerUpdate) {
    if (!examData.sections || examData.sections.length === 0) {
        materialPane.innerHTML = '<p>Không có dữ liệu bài viết.</p>';
        return;
    }

    let currentTaskIndex = 0;

    function render() {
        const section = examData.sections[currentTaskIndex];

        // 1. Render Cột trái (Đề bài & Hình ảnh biểu đồ nếu có)
        materialPane.innerHTML = `
            <div class="passage-tabs">
                ${examData.sections.map((sec, idx) => `
                    <button class="tab-btn ${idx === currentTaskIndex ? 'active' : ''}" data-index="${idx}">
                        ${sec.title}
                    </button>
                `).join('')}
            </div>
            <div class="task-prompt">
                <h3 style="margin-top: 15px; color: var(--primary-color);">${section.title}</h3>
                <div class="passage-text" style="font-weight: bold; margin-bottom: 20px;">
                    ${section.content}
                </div>
                ${section.imageUrl ? `<img src="${section.imageUrl}" alt="Task Image" style="max-width: 100%; border-radius: var(--radius); border: 1px solid var(--border-color); box-shadow: 0 2px 5px rgba(0,0,0,0.1);">` : ''}
            </div>
        `;

        // 2. Render Cột phải (Vùng soạn thảo)
        questionsPane.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0;">Your Answer</h3>
                <div class="word-counter" style="font-size: 16px; font-weight: bold; color: var(--text-color); background: var(--container-bg); padding: 5px 15px; border-radius: 20px; border: 1px solid var(--border-color);">
                    Word count: <span id="word-count-${section.sectionId}" style="color: var(--primary-color);">0</span>
                </div>
            </div>
            
            <textarea id="writing-textarea-${section.sectionId}" class="writing-textarea" placeholder="Type your essay here..." style="height: calc(100vh - 220px); font-size: 16px; line-height: 1.8; resize: none; padding: 20px; outline: none; border: 2px solid var(--border-color);"></textarea>
        `;

        // Focus CSS
        const textarea = questionsPane.querySelector(`#writing-textarea-${section.sectionId}`);
        textarea.addEventListener('focus', () => { textarea.style.borderColor = 'var(--primary-color)'; });
        textarea.addEventListener('blur', () => { textarea.style.borderColor = 'var(--border-color)'; });

        // 3. Gắn sự kiện
        attachEvents(section);
        restoreAnswers(section);
    }

    function attachEvents(section) {
        // Sự kiện chuyển Tab Task 1 / Task 2
        materialPane.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentTaskIndex = parseInt(e.target.getAttribute('data-index'));
                render();
            });
        });

        // Sự kiện nhập liệu & đếm từ
        const textarea = questionsPane.querySelector(`#writing-textarea-${section.sectionId}`);
        const wordCountEl = questionsPane.querySelector(`#word-count-${section.sectionId}`);

        textarea.addEventListener('input', (e) => {
            const text = e.target.value;
            window.examAnswerSheet[`task_${section.sectionId}`] = text;

            const words = text.trim().split(/\s+/);
            const count = text.trim() === '' ? 0 : words.length;
            wordCountEl.textContent = count;

            // Logic nhận diện Target Words và đổi màu
            const targetWords = section.title.toLowerCase().includes('task 1') ? 150 : (section.title.toLowerCase().includes('task 2') ? 250 : 0);
            
            if (targetWords > 0 && count >= targetWords) {
                wordCountEl.classList.add('success');
            } else {
                wordCountEl.classList.remove('success');
            }
        });
    }

    function restoreAnswers(section) {
        const savedText = window.examAnswerSheet[`task_${section.sectionId}`];
        if (savedText) {
            const textarea = questionsPane.querySelector(`#writing-textarea-${section.sectionId}`);
            const wordCountEl = questionsPane.querySelector(`#word-count-${section.sectionId}`);
            
            textarea.value = savedText;
            const words = savedText.trim().split(/\s+/);
            const count = savedText.trim() === '' ? 0 : words.length;
            wordCountEl.textContent = count;
        }
    }

    // Khởi chạy render
    render();
}