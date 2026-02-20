// js/admin.js
import { getAllExams, saveExam, deleteExam } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('admin-exam-list');
    const builderForm = document.getElementById('exam-builder-form');
    const sectionsContainer = document.getElementById('b-sections-container');
    const btnAddSection = document.getElementById('btn-add-section');
    const skillSelect = document.getElementById('b-skill');
    const audioGroup = document.getElementById('b-audio-group');
    const ftForm = document.getElementById('full-test-builder-form');

    // Hàm nạp danh sách đề lẻ vào các ô Select
    async function populateFullTestDropdowns() {
        const exams = await getAllExams();
        const selects = {
            'listening': document.getElementById('ft-listening'),
            'reading': document.getElementById('ft-reading'),
            'writing': document.getElementById('ft-writing'),
            'speaking': document.getElementById('ft-speaking')
        };

        // Reset options
        Object.values(selects).forEach(sel => { if(sel) sel.innerHTML = '<option value="">-- Chọn đề thi --</option>'; });

        exams.forEach(exam => {
            if (exam.skill !== 'full' && selects[exam.skill]) {
                const option = document.createElement('option');
                option.value = exam.id;
                option.textContent = `[ID: ${exam.id}] ${exam.title}`;
                selects[exam.skill].appendChild(option);
            }
        });
    }

    // Gọi hàm này mỗi khi renderList chạy để cập nhật dropdown liên tục
    const originalRenderList = renderList;
    renderList = function() {
        originalRenderList();
        populateFullTestDropdowns();
    };
    populateFullTestDropdowns(); // Gọi lần đầu

    // Xử lý lưu Full Test
    if (ftForm) {
        ftForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const examObj = {
                id: 'full_' + new Date().getTime(),
                title: document.getElementById('ft-title').value.trim(),
                skill: 'full',
                duration: 165 * 60, // Mặc định hiển thị ~165 phút cho tổng 4 kỹ năng
                components: {
                    listening: document.getElementById('ft-listening').value,
                    reading: document.getElementById('ft-reading').value,
                    writing: document.getElementById('ft-writing').value,
                    speaking: document.getElementById('ft-speaking').value
                }
            };

            await saveExam(examObj);
            alert("Đã khởi tạo Full Test thành công!");
            ftForm.reset();
            await renderList();
        });
    }

    async function renderList() {
        const exams = await getAllExams();
        listContainer.innerHTML = '';
        if (exams.length === 0) {
            listContainer.innerHTML = '<p style="color: var(--text-muted);">Chưa có đề thi nào.</p>';
            return;
        }
        exams.forEach(exam => {
            const item = document.createElement('div');
            item.className = 'course-card';
            item.innerHTML = `
                <span class="course-tag">${exam.skill.toUpperCase()}</span>
                <h3 class="course-title">${exam.title}</h3>
                <div class="course-meta">
                    <div>ID: ${exam.id}</div>
                    <div>Thời gian: ${exam.duration / 60} Phút</div>
                </div>
                <button class="btn btn-secondary btn-delete" data-id="${exam.id}" style="color: #ef4444; border-color: #ef4444;">Xóa đề thi</button>
            `;
            listContainer.appendChild(item);
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Chắc chắn xóa đề thi này?')) {
                    await deleteExam(e.target.getAttribute('data-id'));
                    await renderList();
                }
            });
        });
    }

    skillSelect.addEventListener('change', (e) => {
        audioGroup.style.display = e.target.value === 'listening' ? 'block' : 'none';
        if(e.target.value !== 'listening') document.getElementById('b-audio').value = '';
    });

    const getQuestionHTML = () => `
        <div class="builder-card question-card">
            <div class="builder-card-header">
                <span>Câu hỏi</span>
                <button type="button" class="btn-remove remove-node">Xóa</button>
            </div>
            <div class="flex-row">
                <input type="number" class="builder-input q-num" placeholder="Số thứ tự (VD: 1)">
                <input type="text" class="builder-input q-text" placeholder="Nội dung câu hỏi (Dùng ___ cho Gap Fill)">
            </div>
            <div class="builder-form-group">
                <input type="text" class="builder-input q-options" placeholder="Các đáp án nhiễu/đúng, cách nhau bởi dấu phẩy (Dành cho Trắc nghiệm/TFNG)">
            </div>
            <div class="builder-form-group" style="margin-bottom: 0;">
                <input type="text" class="builder-input q-correct" placeholder="Đáp án đúng chính xác">
            </div>
        </div>
    `;

    const getGroupHTML = () => `
        <div class="builder-card group-card">
            <div class="builder-card-header">
                <span>Nhóm câu hỏi</span>
                <button type="button" class="btn-remove remove-node">Xóa</button>
            </div>
            <div class="flex-row">
                <select class="builder-input grp-type" style="flex: 0.4;">
                    <option value="MULTIPLE_CHOICE">Trắc nghiệm (Multiple Choice)</option>
                    <option value="TFNG">True / False / Not Given</option>
                    <option value="GAP_FILL">Điền từ đơn lẻ (Gap Fill)</option>
                    <option value="NOTES_COMPLETION">Điền khuyết đoạn văn (Notes/Summary)</option>
                    <option value="MATCHING" style="font-weight:bold; color:var(--primary-color);">Nối đáp án (Matching Information/Heading)</option>
                </select>
            </div>
            <div class="builder-form-group">
                <textarea class="builder-input grp-instruction" rows="2" placeholder="Hướng dẫn câu hỏi (Nhấn Enter để xuống dòng)" required></textarea>
            </div>
            
            <div class="standard-group-area">
                <div class="questions-container"></div>
                <button type="button" class="btn btn-secondary btn-add-question" style="font-size: 13px;">+ Thêm Câu Hỏi Rời</button>
            </div>

            <div class="notes-group-area" style="display: none; margin-top: 15px; border-top: 1px dashed var(--border-color); padding-top: 15px;">
                <label style="font-size: 14px; font-weight: 600; color: var(--primary-color);">Dán toàn bộ đoạn văn/ghi chú vào đây:</label>
                <textarea class="builder-input grp-notes-content" rows="8" placeholder="Cú pháp: [số câu: đáp án]"></textarea>
            </div>
        </div>
    `;

    const getSectionHTML = (secId) => `
        <div class="builder-card section-card">
            <div class="builder-card-header">
                <span style="color: var(--primary-color);">Section / Passage ${secId}</span>
                <button type="button" class="btn-remove remove-node">Xóa Section</button>
            </div>
            <div class="builder-form-group">
                <input type="text" class="builder-input sec-title" placeholder="Tiêu đề Section" required>
            </div>
            <div class="builder-form-group">
                <textarea class="builder-input sec-content" rows="4" placeholder="Ngữ liệu bài đọc / Đề bài Writing (Nhấn Enter để xuống dòng)"></textarea>
            </div>
            <div class="groups-container"></div>
            <button type="button" class="btn btn-secondary btn-add-group" style="font-size: 14px;">+ Thêm Nhóm Câu Hỏi</button>
        </div>
    `;

    let sectionCounter = 0;
    
    btnAddSection.addEventListener('click', () => {
        sectionCounter++;
        sectionsContainer.insertAdjacentHTML('beforeend', getSectionHTML(sectionCounter));
    });

    sectionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-node')) e.target.closest('.builder-card').remove();
        if (e.target.classList.contains('btn-add-group')) e.target.previousElementSibling.insertAdjacentHTML('beforeend', getGroupHTML());
        if (e.target.classList.contains('btn-add-question')) e.target.previousElementSibling.insertAdjacentHTML('beforeend', getQuestionHTML());
    });

    // Lắng nghe sự kiện chuyển đổi loại câu hỏi để hiện Textarea thông minh
    sectionsContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('grp-type')) {
            const groupCard = e.target.closest('.group-card');
            const standardArea = groupCard.querySelector('.standard-group-area');
            const notesArea = groupCard.querySelector('.notes-group-area');
            
            if (e.target.value === 'NOTES_COMPLETION') {
                standardArea.style.display = 'none';
                notesArea.style.display = 'block';
            } else {
                standardArea.style.display = 'block';
                notesArea.style.display = 'none';
            }
        }
    });

    builderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const examObj = {
            id: 'exam_' + new Date().getTime(),
            title: document.getElementById('b-title').value.trim(),
            skill: document.getElementById('b-skill').value,
            duration: parseInt(document.getElementById('b-duration').value) * 60,
            audioUrl: document.getElementById('b-audio').value.trim() || undefined,
            sections: []
        };

        sectionsContainer.querySelectorAll('.section-card').forEach((secNode, index) => {
            const sectionData = {
                sectionId: index + 1,
                title: secNode.querySelector('.sec-title').value.trim(),
                content: secNode.querySelector('.sec-content').value.trim().replace(/\n/g, '<br>'), // Hỗ trợ xuống dòng
                questionGroups: []
            };

            secNode.querySelectorAll('.group-card').forEach(grpNode => {
                const groupType = grpNode.querySelector('.grp-type').value;
                // Xử lý xuống dòng cho Hướng dẫn
                const rawInstruction = grpNode.querySelector('.grp-instruction').value.trim();
                const formattedInstruction = rawInstruction.replace(/\n/g, '<br>');

                const groupData = {
                    type: groupType,
                    instruction: formattedInstruction,
                    questions: []
                };

                if (groupType === 'NOTES_COMPLETION') {
                    // XỬ LÝ SMART PARSER ĐIỀN KHUYẾT ĐOẠN VĂN
                    let rawNotes = grpNode.querySelector('.grp-notes-content').value.trim();
                    let formattedNotes = rawNotes.replace(/\n/g, '<br>'); // Giữ nguyên định dạng xuống dòng

                    // Thuật toán quét tìm cú pháp [số: đáp án]
                    const regex = /\[(\d+):\s*([^\]]+)\]/g;
                    formattedNotes = formattedNotes.replace(regex, (match, qNumStr, qAns) => {
                        const qNum = parseInt(qNumStr);
                        groupData.questions.push({ number: qNum, correctAnswer: qAns.trim() });
                        return `[[${qNum}]]`; // Đặt cờ giữ chỗ để hiển thị ô input bên giao diện sinh viên
                    });
                    groupData.content = formattedNotes;
                } else {
                    // Logic cũ cho các câu hỏi rời
                    grpNode.querySelectorAll('.question-card').forEach(qNode => {
                        const qOptionsRaw = qNode.querySelector('.q-options').value.trim();
                        const optionsArray = qOptionsRaw ? qOptionsRaw.split(',').map(s => s.trim()) : [];
                        groupData.questions.push({
                            questionId: 'q_' + new Date().getTime() + Math.floor(Math.random() * 1000),
                            number: parseInt(qNode.querySelector('.q-num').value),
                            text: qNode.querySelector('.q-text').value.trim(),
                            options: optionsArray.length > 0 ? optionsArray : undefined,
                            correctAnswer: qNode.querySelector('.q-correct').value.trim() || undefined
                        });
                    });
                }

                if (groupData.questions.length > 0) sectionData.questionGroups.push(groupData);
            });
            examObj.sections.push(sectionData);
        });

        if (examObj.sections.length === 0) return alert("Vui lòng thêm ít nhất 1 Section.");
        
        await saveExam(examObj);
        alert("Đã khởi tạo và lưu đề thi thành công!");
        builderForm.reset();
        sectionsContainer.innerHTML = '';
        sectionCounter = 0;
        audioGroup.style.display = 'none';
        await renderList();
    });


    renderList();
});

// --- LOGIC LƯU API KEY CHO AI ---
    const apiKeyInput = document.getElementById('admin-api-key');
    const btnSaveApi = document.getElementById('btn-save-api');
    
    // Hiển thị key đã lưu (nếu có)
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey && apiKeyInput) {
        apiKeyInput.value = savedKey;
    }

    if (btnSaveApi) {
        btnSaveApi.addEventListener('click', () => {
            const key = apiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('gemini_api_key', key);
                alert("Đã lưu API Key thành công! Hệ thống đã sẵn sàng chấm bài Writing.");
            } else {
                localStorage.removeItem('gemini_api_key');
                alert("Đã xóa API Key.");
            }
        });
    }