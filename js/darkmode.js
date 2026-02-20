// js/darkmode.js

document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    // Kiểm tra trạng thái lưu trong localStorage
    const currentTheme = localStorage.getItem('theme');
    
    // Khôi phục trạng thái khi load trang
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.textContent = 'Giao diện Sáng';
    } else {
        if (darkModeToggle) darkModeToggle.textContent = 'Giao diện Tối';
    }

    // Xử lý sự kiện click bật/tắt
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
                darkModeToggle.textContent = 'Giao diện Sáng';
            } else {
                localStorage.setItem('theme', 'light');
                darkModeToggle.textContent = 'Giao diện Tối';
            }
        });
    }
});