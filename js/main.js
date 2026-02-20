// js/main.js
import { getAllExams } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    const courseList = document.getElementById('course-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    if (!courseList) return;

    // Lấy toàn bộ dữ liệu từ storage
    const allExams = getAllExams();

    // Hàm render danh sách bài thi dựa trên bộ lọc
    function renderCourses(filterValue = 'all') {
        courseList.innerHTML = '';
        
        // Logic lọc mảng: nếu là 'all' thì lấy hết, ngược lại so sánh chính xác với thuộc tính skill
        const filteredExams = filterValue === 'all' 
            ? allExams 
            : allExams.filter(exam => (exam.skill || '').toLowerCase() === filterValue);

        // Hiển thị thông báo nếu không có dữ liệu cho tab hiện tại
        if (filteredExams.length === 0) {
            courseList.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px 0; color: var(--text-muted); background: var(--container-bg); border-radius: var(--radius); border: 1px dashed var(--border-color);">
                    <p style="font-size: 16px; font-weight: 600;">No tests available in this category.</p>
                    <p style="font-size: 14px; margin-top: 8px;">Please go to the Admin Panel to create a new one.</p>
                </div>
            `;
            return;
        }

        // Tạo card cho các đề thi đã lọc
        filteredExams.forEach(exam => {
            const card = document.createElement('div');
            card.className = 'course-card';
            
            const minutes = Math.floor(exam.duration / 60);
            const questionCountText = (exam.skill === 'speaking' || exam.skill === 'writing') ? 'Standard Format' : '40 Questions';
            
            card.innerHTML = `
                <span class="course-tag">${exam.skill.toUpperCase()}</span>
                <h3 class="course-title">${exam.title}</h3>
                <div class="course-meta">
                    <div>Duration: ${minutes} Minutes</div>
                    <div style="margin-top: 8px;">Format: ${questionCountText}</div>
                </div>
                <button class="btn btn-primary" onclick="window.location.href='student/exam.html?id=${exam.id}'">
                    Start Practice
                </button>
            `;
            courseList.appendChild(card);
        });
    }

    // Gắn sự kiện click cho từng nút Category Filter
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Xóa trạng thái active của tất cả các nút
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Gắn trạng thái active cho nút vừa click
            e.target.classList.add('active');
            
            // Lấy giá trị data-filter và gọi lại hàm render
            const selectedFilter = e.target.getAttribute('data-filter');
            renderCourses(selectedFilter);
        });
    });

    // Khởi chạy render lần đầu với tab "All Skills"
    renderCourses('all');
});