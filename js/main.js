import { getAllExams } from './storage.js';

let allExams = [];
let courseList;   // 👈 ĐƯA RA NGOÀI

// ===============================
// RENDER FUNCTION
// ===============================
function renderCourses(filterValue = 'all') {

    if (!courseList) return;  // 👈 tránh crash

    courseList.innerHTML = '';

    const filteredExams = filterValue === 'all'
        ? allExams
        : allExams.filter(exam =>
            (exam.skill || '').toLowerCase() === filterValue
        );

    if (filteredExams.length === 0) {
        courseList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px 0;">
                <p>No tests available in this category.</p>
            </div>
        `;
        return;
    }

    filteredExams.forEach(exam => {
        const card = document.createElement('div');
        card.className = 'course-card';

        const minutes = Math.floor(exam.duration / 60);

        card.innerHTML = `
            <span class="course-tag">${exam.skill.toUpperCase()}</span>
            <h3>${exam.title}</h3>
            <div>Duration: ${minutes} Minutes</div>
            <button onclick="window.location.href='student/exam.html?id=${exam.id}'">
                Start Practice
            </button>
        `;

        courseList.appendChild(card);
    });
}

// ===============================
// DOM LOAD
// ===============================
document.addEventListener("DOMContentLoaded", async () => {

    courseList = document.getElementById('course-list');  // 👈 gán ở đây

    try {
        const data = await getAllExams();
        allExams = Array.isArray(data) ? data : [];
        renderCourses();
    } catch (error) {
        console.error("Failed to load exams:", error);
        allExams = [];
        renderCourses();
    }

    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const selectedFilter = e.target.getAttribute('data-filter');
            renderCourses(selectedFilter);
        });
    });

});