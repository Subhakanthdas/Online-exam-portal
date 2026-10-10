
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student'
        CHECK (role IN ('student', 'creator')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS practice_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    options_json TEXT NOT NULL CHECK (json_valid(options_json)),
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT NOT NULL DEFAULT 'medium'
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, question_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES practice_questions(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS practice_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answer TEXT,
    is_correct INTEGER CHECK (is_correct IN (0, 1)),
    attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES practice_questions(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT,
    duration_minutes INTEGER NOT NULL
        CHECK (duration_minutes BETWEEN 1 AND 600),
    attempt_limit INTEGER NOT NULL DEFAULT 1
        CHECK (attempt_limit BETWEEN 1 AND 100),
    access_code TEXT NOT NULL UNIQUE,
    is_published INTEGER NOT NULL DEFAULT 0
        CHECK (is_published IN (0, 1)),
    starts_at TEXT,
    ends_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS exam_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    options_json TEXT NOT NULL CHECK (json_valid(options_json)),
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
    position INTEGER NOT NULL CHECK (position > 0),
    UNIQUE (exam_id, position),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    deadline_at TEXT NOT NULL,
    submitted_at TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'submitted', 'expired')),
    score REAL,
    max_score REAL,
    UNIQUE (exam_id, student_id, attempt_number),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE RESTRICT,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS exam_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    exam_question_id INTEGER NOT NULL,
    selected_answer TEXT,
    is_correct INTEGER CHECK (is_correct IN (0, 1)),
    points_awarded REAL CHECK (points_awarded IS NULL OR points_awarded >= 0),
    saved_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (attempt_id, exam_question_id),
    FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_question_id) REFERENCES exam_questions(id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_practice_questions_subject
    ON practice_questions(subject_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user
    ON bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_practice_attempts_user
    ON practice_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_exams_creator
    ON exams(creator_id);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam
    ON exam_questions(exam_id);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_student
    ON exam_attempts(student_id);

CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt
    ON exam_answers(attempt_id);