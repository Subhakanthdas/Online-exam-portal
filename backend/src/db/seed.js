import bcrypt from 'bcryptjs';

const DEFAULT_SUBJECTS = [
  { name: 'Java', description: 'Java programming and object-oriented concepts' },
  { name: 'Python', description: 'Python programming fundamentals' },
  { name: 'Data Structures', description: 'Arrays, linked lists, stacks, queues, and trees' },
  { name: 'Algorithms', description: 'Searching, sorting, and algorithm design' },
  { name: 'Database Management', description: 'SQL and relational database concepts' },
  { name: 'Computer Networks', description: 'Networking fundamentals and protocols' },
];

const DEMO_EXAMS = [
  { title: 'Java Fundamentals — Sample Exam', description: 'Variables, OOP, and core Java concepts.', duration: 10, code: 'JAVA26', questions: [
    ['Which keyword creates a subclass in Java?', ['this','extends','implements','super'], 'extends'],
    ['Which method is the usual Java program entry point?', ['start()','run()','main()','init()'], 'main()'],
    ['Which type stores true or false?', ['int','String','boolean','char'], 'boolean'],
    ['Which collection does not allow duplicate elements?', ['ArrayList','HashSet','LinkedList','Vector'], 'HashSet'],
    ['Which keyword prevents a class from being subclassed?', ['static','const','final','private'], 'final']
  ]},
  { title: 'Python Basics — Sample Exam', description: 'A short Python fundamentals quiz.', duration: 10, code: 'PYTH26', questions: [
    ['Which symbol starts a comment in Python?', ['//','#','<!--','**'], '#'],
    ['Which type is immutable?', ['list','dict','set','tuple'], 'tuple'],
    ['What does len([1, 2, 3]) return?', ['2','3','4','None'], '3'],
    ['Which keyword defines a function?', ['func','define','def','function'], 'def'],
    ['What is the result of 3 ** 2?', ['6','9','5','8'], '9']
  ]},
  { title: 'Data Structures — Sample Exam', description: 'Stacks, queues, and algorithmic basics.', duration: 10, code: 'DSA026', questions: [
    ['Which data structure follows LIFO?', ['Queue','Stack','Tree','Graph'], 'Stack'],
    ['Which data structure follows FIFO?', ['Stack','Heap','Queue','Set'], 'Queue'],
    ['What is the typical average lookup time in a hash table?', ['O(1)','O(n)','O(log n)','O(n²)'], 'O(1)'],
    ['Which traversal visits root, left, then right?', ['Inorder','Postorder','Preorder','Level order'], 'Preorder'],
    ['Binary search requires the data to be?', ['Random','Sorted','Unique only','Reversed'], 'Sorted']
  ]}
];

function seedSubjects(db) {
  const insertSubject = db.prepare(`INSERT INTO subjects (name, description) VALUES (@name, @description) ON CONFLICT(name) DO NOTHING`);
  db.transaction((subjects) => { for (const subject of subjects) insertSubject.run(subject); })(DEFAULT_SUBJECTS);
  seedDemoExams(db);
}

function seedDemoExams(db) {
  const demoEmail = 'creator@examforge.demo';
  let creator = db.prepare('SELECT id FROM users WHERE email = ?').get(demoEmail);
  if (!creator) {
    const hash = bcrypt.hashSync('CreatorDemo123!', 10);
    const result = db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,'creator')")
      .run('Demo Exam Creator', demoEmail, hash);
    creator = { id: Number(result.lastInsertRowid) };
  }
  const insertExam = db.prepare(`INSERT INTO exams (creator_id,title,description,duration_minutes,access_code,is_published)
    VALUES (?,?,?,?,?,1) ON CONFLICT(access_code) DO NOTHING`);
  const findExam = db.prepare('SELECT id FROM exams WHERE access_code = ?');
  const countQuestions = db.prepare('SELECT COUNT(*) AS n FROM exam_questions WHERE exam_id = ?');
  const addQuestion = db.prepare(`INSERT INTO exam_questions (exam_id,question_text,options_json,correct_answer,points,position) VALUES (?,?,?,?,1,?)`);
  for (const item of DEMO_EXAMS) {
    insertExam.run(creator.id, item.title, item.description, item.duration, item.code);
    const exam = findExam.get(item.code);
    if (exam && countQuestions.get(exam.id).n === 0) {
      db.transaction(() => item.questions.forEach((q, i) => addQuestion.run(exam.id, q[0], JSON.stringify(q[1]), q[2], i + 1)))();
    }
  }
}

export { seedSubjects, DEFAULT_SUBJECTS };
