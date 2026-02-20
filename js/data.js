// js/data.js

const appData = {
    vocabulary: [
        { word: "Curriculum", type: "noun", meaning: "Chương trình giảng dạy" },
        { word: "Pedagogy", type: "noun", meaning: "Sư phạm, phương pháp giảng dạy" },
        { word: "Plagiarism", type: "noun", meaning: "Sự đạo văn" },
        { word: "Bursary", type: "noun", meaning: "Học bổng (dựa trên nhu cầu tài chính)" },
        { word: "Extracurricular", type: "adjective", meaning: "Ngoại khóa" },
        { word: "Thesis", type: "noun", meaning: "Luận văn, luận án" }
    ],
    listening: [
        { id: "l1", title: "Listening Test 1", description: "Section 1 & 2: Everyday social contexts." },
        { id: "l2", title: "Listening Test 2", description: "Section 3 & 4: Educational and training contexts." }
    ],
    reading: [
        { id: "r1", title: "Reading Test 1", description: "Passage 1: The history of coffee." },
        { id: "r2", title: "Reading Test 2", description: "Passage 2: Artificial intelligence in education." }
    ],
    writing: [
        { id: "w1", title: "Writing Task 1", description: "Line graph showing population trends." },
        { id: "w2", title: "Writing Task 2", description: "Essay: Advantages and disadvantages of online learning." }
    ],
    speaking: [
        { id: "s1", title: "Speaking Part 1", description: "Familiar topics: Hometown, Hobbies." },
        { id: "s2", title: "Speaking Part 2", description: "Describe a memorable journey you have made." }
    ],
    quiz: [
        {
            question: "Choose the correct synonym for 'Diligent':",
            options: ["Lazy", "Hardworking", "Careless", "Ignorant"],
            answer: 1 // Index 1: Hardworking
        },
        {
            question: "Fill in the blank: She has been living here ___ 2010.",
            options: ["in", "for", "since", "at"],
            answer: 2 // Index 2: since
        },
        {
            question: "Which of the following is an uncountable noun?",
            options: ["Chair", "Information", "Car", "Apple"],
            answer: 1 // Index 1: Information
        }
    ]
};