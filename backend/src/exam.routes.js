import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { db } from './db/database.js';
import { authenticate, requireRole } from './auth/auth.middleware.js';
const router = Router();
router.use(authenticate);
router.get('/subjects', (_req,res)=>res.json({subjects:db.prepare('SELECT id,name,description FROM subjects ORDER BY name').all()}));
router.get('/exams', (req,res)=>{
 const exams = req.user.role==='creator'
 ? db.prepare('SELECT e.*, (SELECT COUNT(*) FROM exam_questions q WHERE q.exam_id=e.id) question_count FROM exams e WHERE creator_id=? ORDER BY created_at DESC').all(req.user.id)
 : db.prepare("SELECT e.id,e.title,e.description,e.duration_minutes,e.access_code,e.created_at,u.name creator_name,(SELECT COUNT(*) FROM exam_questions q WHERE q.exam_id=e.id) question_count FROM exams e JOIN users u ON u.id=e.creator_id WHERE e.is_published=1 ORDER BY e.created_at DESC").all();
 res.json({exams});
});
router.post('/exams', requireRole('creator'), (req,res)=>{
 const {title,description='',durationMinutes=30,questions=[]}=req.body||{};
 if(typeof title!=='string'||title.trim().length<3||title.length>120) return res.status(400).json({error:'Title must be 3–120 characters.'});
 if(!Number.isInteger(durationMinutes)||durationMinutes<1||durationMinutes>600) return res.status(400).json({error:'Duration must be between 1 and 600 minutes.'});
 if(!Array.isArray(questions)||questions.length<1||questions.length>100) return res.status(400).json({error:'Add between 1 and 100 questions.'});
 for(const [i,q] of questions.entries()) if(!q.text?.trim()||!Array.isArray(q.options)||q.options.length<2||q.options.some(x=>!String(x).trim())||!q.options.includes(q.correctAnswer)) return res.status(400).json({error:`Question ${i+1} needs text, options, and a correct answer.`});
 const code=randomBytes(3).toString('hex').toUpperCase();
 const create=db.transaction(()=>{const e=db.prepare('INSERT INTO exams (creator_id,title,description,duration_minutes,access_code,is_published) VALUES (?,?,?,?,?,1)').run(req.user.id,title.trim(),String(description).slice(0,1000),durationMinutes,code);const add=db.prepare('INSERT INTO exam_questions (exam_id,question_text,options_json,correct_answer,points,position) VALUES (?,?,?,?,?,?)');questions.forEach((q,i)=>add.run(e.lastInsertRowid,q.text.trim(),JSON.stringify(q.options.map(String)),q.correctAnswer,1,i+1));return Number(e.lastInsertRowid)});
 const id=create();res.status(201).json({exam:db.prepare('SELECT * FROM exams WHERE id=?').get(id)});
});
router.get('/exams/:id', (req,res)=>{const exam=db.prepare('SELECT e.*,u.name creator_name FROM exams e JOIN users u ON u.id=e.creator_id WHERE e.id=? AND (e.is_published=1 OR e.creator_id=?)').get(Number(req.params.id),req.user.id);if(!exam)return res.status(404).json({error:'Exam not found.'});const questions=db.prepare('SELECT id,question_text,options_json,position,points FROM exam_questions WHERE exam_id=? ORDER BY position').all(exam.id).map(q=>({id:q.id,text:q.question_text,options:JSON.parse(q.options_json),position:q.position,points:q.points}));res.json({exam,questions});});
router.post('/exams/join', (req,res)=>{const code=String(req.body?.code||'').trim().toUpperCase();const exam=db.prepare('SELECT id FROM exams WHERE access_code=? AND is_published=1').get(code);if(!exam)return res.status(404).json({error:'No published exam matches that code.'});res.json({examId:exam.id});});
router.post('/exams/:id/submit', (req,res)=>{const exam=db.prepare('SELECT * FROM exams WHERE id=? AND is_published=1').get(Number(req.params.id));if(!exam)return res.status(404).json({error:'Exam not found.'});if(req.user.role==='creator')return res.status(403).json({error:'Creator accounts cannot take exams.'});const questions=db.prepare('SELECT id,correct_answer,points FROM exam_questions WHERE exam_id=? ORDER BY position').all(exam.id);if(!questions.length)return res.status(400).json({error:'This exam has no questions.'});const answers=req.body?.answers||{};let score=0,maxScore=0;for(const q of questions){maxScore+=q.points;if(answers[q.id]===q.correct_answer)score+=q.points;}const attemptNumber=(db.prepare('SELECT COUNT(*) n FROM exam_attempts WHERE exam_id=? AND student_id=?').get(exam.id,req.user.id).n)+1;const deadline=new Date(Date.now()+exam.duration_minutes*60000).toISOString();const tx=db.transaction(()=>{const a=db.prepare("INSERT INTO exam_attempts (exam_id,student_id,attempt_number,deadline_at,submitted_at,status,score,max_score) VALUES (?,?,?,?,?,'submitted',?,?)").run(exam.id,req.user.id,attemptNumber,deadline,new Date().toISOString(),score,maxScore);const add=db.prepare('INSERT INTO exam_answers (attempt_id,exam_question_id,selected_answer,is_correct,points_awarded) VALUES (?,?,?,?,?)');for(const q of questions){const chosen=answers[q.id]??null;const correct=chosen===q.correct_answer;add.run(a.lastInsertRowid,q.id,chosen,correct?1:0,correct?q.points:0);}return Number(a.lastInsertRowid)});const attemptId=tx();res.status(201).json({result:{attemptId,score,maxScore,percentage:Math.round(score/maxScore*100),correct:score,questionCount:questions.length}});});
router.get('/results', (req, res) => {
  const results = req.user.role === 'creator'
    ? db.prepare(`SELECT a.id, a.score, a.max_score, a.submitted_at, e.title, u.name AS student_name
      FROM exam_attempts a
      JOIN exams e ON e.id = a.exam_id
      JOIN users u ON u.id = a.student_id
      WHERE e.creator_id = ? AND a.status = 'submitted'
      ORDER BY a.submitted_at DESC`).all(req.user.id)
    : db.prepare(`SELECT a.id, a.score, a.max_score, a.submitted_at, e.title
      FROM exam_attempts a
      JOIN exams e ON e.id = a.exam_id
      WHERE a.student_id = ? AND a.status = 'submitted'
      ORDER BY a.submitted_at DESC`).all(req.user.id);
  res.json({ results });
});
export default router;
