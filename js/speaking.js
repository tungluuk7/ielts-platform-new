// js/speaking.js

export function renderSpeaking(examData, materialPane, questionsPane) {
    if (!examData.sections || examData.sections.length === 0) {
        materialPane.innerHTML = '<p>Không có dữ liệu bài nói.</p>';
        return;
    }

    // 1. Render Cột trái (Hướng dẫn chung)
    materialPane.innerHTML = `
        <div class="speaking-instruction" style="background-color: var(--container-bg); padding: 20px; border-radius: var(--radius); border-left: 4px solid var(--primary-color);">
            <h2 style="color: var(--primary-color); margin-bottom: 15px;">Speaking Test Guide</h2>
            <p>Bài thi Speaking gồm 3 phần, kéo dài khoảng 11-14 phút:</p>
            <ul style="padding-left: 20px; line-height: 1.8; margin-top: 10px;">
                <li><strong>Part 1 (4-5 phút):</strong> Các câu hỏi về bản thân và các chủ đề quen thuộc (gia đình, công việc, sở thích...).</li>
                <li><strong>Part 2 (3-4 phút):</strong> Thí sinh có 1 phút chuẩn bị và 2 phút nói liên tục về một chủ đề cụ thể (Cue Card).</li>
                <li><strong>Part 3 (4-5 phút):</strong> Thảo luận mở rộng về các vấn đề trừu tượng liên quan đến chủ đề ở Part 2.</li>
            </ul>
            <p style="margin-top: 20px; font-style: italic; color: #666;">* Lưu ý: Hiện tại hệ thống chỉ hỗ trợ xem trước câu hỏi. Tính năng ghi âm sẽ được cập nhật sau.</p>
        </div>
    `;

    // 2. Render Cột phải (Danh sách câu hỏi)
    let questionsHTML = '';
    
    examData.sections.forEach((section) => {
        questionsHTML += `
            <div class="speaking-part" style="margin-bottom: 40px;">
                <h3 style="background-color: var(--primary-color); color: white; padding: 10px 15px; border-radius: var(--radius) var(--radius) 0 0; margin-bottom: 0;">
                    ${section.title}
                </h3>
                <div style="background-color: var(--container-bg); padding: 20px; border: 1px solid var(--border-color); border-top: none; border-radius: 0 0 var(--radius) var(--radius);">
        `;

        // Nếu là Part 2 (Cue Card), hiển thị dạng khung đặc biệt
        if (section.title.includes("Part 2")) {
            questionsHTML += `
                <div class="cue-card" style="border: 2px solid var(--text-color); padding: 20px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    <p style="margin-bottom: 15px;">${section.content}</p>
                    <ul style="padding-left: 20px; font-weight: normal;">
                        ${section.questions.map(q => `<li style="margin-bottom: 8px;">${q}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            // Part 1 và Part 3
            questionsHTML += `
                <ul class="speaking-questions-list" style="list-style-type: decimal; padding-left: 20px; font-size: 16px; line-height: 1.8;">
                    ${section.questions.map(q => `<li style="margin-bottom: 10px;">${q}</li>`).join('')}
                </ul>
            `;
        }

        questionsHTML += `</div></div>`;
    });

    questionsPane.innerHTML = questionsHTML;
}