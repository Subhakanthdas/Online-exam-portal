
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  ChartNoAxesCombined,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AuthModal from './AuthForm.jsx';

const features = [
  {
    icon: BrainCircuit,
    title: 'Practice with purpose',
    text: 'Sharpen your skills with topic-based MCQs, clear explanations, and progress you can actually track.',
  },
  {
    icon: Clock3,
    title: 'Exam day, simplified',
    text: 'Take timed assessments with a focused question view and a clear sense of how much time remains.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Learn from every result',
    text: 'Turn completed attempts into useful feedback and understand where to focus next.',
  },
];


function Dashboard({ session, onLogout, onNotice }) {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [results, setResults] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questions, setQuestions] = useState([{ text: '', options: ['', '', '', ''], correctAnswer: '' }]);
  const [busy, setBusy] = useState(false);
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` };
  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const contentType = response.headers.get('content-type') || '';
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : {}; }
    catch {
      const detail = contentType.includes('text/html')
        ? 'The server returned an HTML page instead of API JSON. Check that the backend is running and the /api proxy is configured.'
        : 'The server returned an invalid response. Please try again.';
      throw new Error(detail);
    }
    if (!response.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
  }
  async function refresh() {
    try { const [e, r, s] = await Promise.all([request('/api/exams'), request('/api/results'), request('/api/subjects')]); setExams(e.exams); setResults(r.results); setSubjects(s.subjects || []); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { refresh(); }, []);
  async function createExam(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try { const data = await request('/api/exams', { method: 'POST', body: JSON.stringify({ title, description, durationMinutes: Number(durationMinutes), questions }) }); setTitle(''); setDescription(''); setQuestions([{ text: '', options: ['', '', '', ''], correctAnswer: '' }]); onNotice(`Exam published! Join code: ${data.exam.access_code}`); await refresh(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function openExam(id) {
    setError(''); setResult(null);
    try { const data = await request(`/api/exams/${id}`); setActiveExam(data); setAnswers({}); }
    catch (e) { setError(e.message); }
  }
  async function joinByCode(event) {
    event.preventDefault(); setError('');
    try { const data = await request('/api/exams/join', { method: 'POST', body: JSON.stringify({ code }) }); setCode(''); await openExam(data.examId); }
    catch (e) { setError(e.message); }
  }
  async function submitExam() {
    setBusy(true); setError('');
    try { const data = await request(`/api/exams/${activeExam.exam.id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }); setResult(data.result); setActiveExam(null); await refresh(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const creator = session.user.role === 'creator';
  const card = { background: '#fff', border: '1px solid #e4e9f2', borderRadius: 16, padding: 22, boxShadow: '0 8px 30px #1825440a' };
  const field = { width: '100%', padding: 11, border: '1px solid #d7deea', borderRadius: 9, marginTop: 6, boxSizing: 'border-box', font: 'inherit' };
  if (activeExam) return <main style={{ maxWidth: 900, margin: '40px auto', padding: 20, color: '#182544' }}><button className="btn btn-outline" onClick={() => setActiveExam(null)}>← Back</button><div style={{ ...card, marginTop: 18 }}><h1>{activeExam.exam.title}</h1><p>{activeExam.exam.description}</p><p>Duration: {activeExam.exam.duration_minutes} minutes · {activeExam.questions.length} questions</p>{activeExam.questions.map((q, i) => <section key={q.id} style={{ padding: '18px 0', borderTop: '1px solid #e8edf5' }}><h3>{i + 1}. {q.text}</h3>{q.options.map(option => <label key={option} style={{ display: 'block', padding: 9, cursor: 'pointer' }}><input type="radio" name={`q-${q.id}`} checked={answers[q.id] === option} onChange={() => setAnswers(a => ({ ...a, [q.id]: option }))} />{' '}{option}</label>)}</section>)}<button className="btn btn-primary" disabled={busy} onClick={submitExam}>{busy ? 'Submitting…' : 'Submit exam'}</button></div></main>;
  return <main style={{ maxWidth: 1100, margin: '30px auto', padding: 20, color: '#182544' }}><header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 25 }}><div><div className="eyebrow">EXAMFORGE WORKSPACE</div><h1 style={{ margin: '8px 0' }}>Welcome, {session.user.name}!</h1><p>{creator ? 'Create and publish assessments for your students.' : 'Choose an exam, enter its code, and review your results.'}</p></div><button className="btn btn-outline" onClick={onLogout}>Log out</button></header>
  {error && <div role="alert" style={{ ...card, borderColor: '#f0b4b4', color: '#a32727', marginBottom: 18 }}>{error}</div>}
  {result && <div style={{ ...card, marginBottom: 20, background: '#f0faf5' }}><h2>Exam submitted successfully!</h2><p style={{ fontSize: 22, fontWeight: 800 }}>Score: {result.score} / {result.maxScore} ({result.percentage}%)</p><p>You answered {result.correct} point(s) correctly out of {result.questionCount} questions.</p><button className="btn btn-primary" onClick={() => setResult(null)}>Continue</button></div>}
  {creator ? <section style={{ ...card, marginBottom: 22 }}><h2>Create an exam</h2><form onSubmit={createExam}><label>Exam title<input style={field} value={title} onChange={e=>setTitle(e.target.value)} minLength={3} maxLength={120} required placeholder="e.g. Java Fundamentals" /></label><label style={{ display:'block', marginTop:12 }}>Description<textarea style={field} value={description} onChange={e=>setDescription(e.target.value)} placeholder="What should students know?" /></label><label style={{ display:'block', marginTop:12 }}>Duration in minutes<input style={field} type="number" min="1" max="600" value={durationMinutes} onChange={e=>setDurationMinutes(e.target.value)} required /></label><h3>Questions</h3>{questions.map((q,i)=><div key={i} style={{ padding:15, margin:'12px 0', border:'1px solid #e4e9f2', borderRadius:12 }}><label>Question {i+1}<input style={field} value={q.text} onChange={e=>setQuestions(list=>list.map((x,j)=>i===j?{...x,text:e.target.value}:x))} required placeholder="Type the question" /></label><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10, marginTop:10 }}>{q.options.map((opt,j)=><label key={j}>Option {j+1}<input style={field} value={opt} onChange={e=>setQuestions(list=>list.map((x,k)=>i===k?{...x,options:x.options.map((v,n)=>j===n?e.target.value:v),correctAnswer:x.correctAnswer===opt?'':x.correctAnswer}:x))} required /></label>)}</div><label style={{ display:'block', marginTop:10 }}>Correct answer<select style={field} value={q.correctAnswer} onChange={e=>setQuestions(list=>list.map((x,j)=>i===j?{...x,correctAnswer:e.target.value}:x))} required><option value="">Select the correct option</option>{q.options.filter(Boolean).map((o,j)=><option key={`${o}-${j}`} value={o}>{o}</option>)}</select></label>{questions.length>1&&<button type="button" className="btn btn-outline" style={{ marginTop:10 }} onClick={()=>setQuestions(list=>list.filter((_,j)=>j!==i))}>Remove question</button>}</div>)}<button type="button" className="btn btn-outline" onClick={()=>setQuestions(list=>[...list,{text:'',options:['','','',''],correctAnswer:''}])} disabled={questions.length>=100}>+ Add question</button>{' '}<button className="btn btn-primary" type="submit" disabled={busy}>{busy?'Publishing…':'Publish exam'}</button></form></section> : <form onSubmit={joinByCode} style={{ ...card, marginBottom:22 }}><h2>Join with an exam code</h2><div style={{ display:'flex', gap:10, flexWrap:'wrap' }}><input style={{ ...field, flex:'1 1 220px', marginTop:0 }} value={code} onChange={e=>setCode(e.target.value)} placeholder="Enter code from your creator" required /><button className="btn btn-primary">Join exam</button></div></form>}
  <section style={{ ...card, marginBottom:22 }}><h2>Subjects</h2>{subjects.length===0?<p>No subjects were returned by the server.</p>:<div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10 }}>{subjects.map(subject=><article key={subject.id} style={{ border:'1px solid #e4e9f2', borderRadius:10, padding:13 }}><strong>{subject.name}</strong><p style={{ marginBottom:0, fontSize:13, color:'#667085' }}>{subject.description}</p></article>)}</div>}</section>
  <section style={{ ...card, marginBottom:22 }}><h2>{creator?'Your published exams':'Available exams'}</h2>{exams.length===0?<p>No exams yet. {creator?'Create one above to get started.':'Ask your exam creator for the access code.'}</p>:<div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14 }}>{exams.map(exam=><article key={exam.id} style={{ border:'1px solid #e4e9f2', borderRadius:12, padding:16 }}><h3>{exam.title}</h3><p>{exam.description||'Online assessment'}</p><p>{exam.duration_minutes} minutes · {exam.question_count} questions</p>{creator?<p><strong>Join code: {exam.access_code}</strong></p>:<button className="btn btn-primary" onClick={()=>openExam(exam.id)}>Take exam</button>}</article>)}</div>}</section>
  <section style={card}><h2>{creator?'Student submissions':'Your results'}</h2>{results.length===0?<p>No submitted exams yet.</p>:<div style={{ overflowX:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse' }}><thead><tr><th align="left">Exam</th>{creator&&<th align="left">Student</th>}<th align="left">Score</th><th align="left">Submitted</th></tr></thead><tbody>{results.map(r=><tr key={r.id}><td style={{ padding:'12px 4px', borderTop:'1px solid #e4e9f2' }}>{r.title}</td>{creator&&<td style={{ padding:'12px 4px', borderTop:'1px solid #e4e9f2' }}>{r.student_name}</td>}<td style={{ padding:'12px 4px', borderTop:'1px solid #e4e9f2' }}>{r.score}/{r.max_score}</td><td style={{ padding:'12px 4px', borderTop:'1px solid #e4e9f2' }}>{r.submitted_at}</td></tr>)}</tbody></table></div>}</section></main>;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [authMode, setAuthMode] = useState(null);

  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem('examforgeSession') || 'null'
      );
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!session?.token) return;

    let cancelled = false;

    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Session expired');
        }
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;

        const updatedSession = {
          ...session,
          user: data.user,
        };

        sessionStorage.setItem(
          'examforgeSession',
          JSON.stringify(updatedSession)
        );
        setSession(updatedSession);
      })
      .catch(() => {
        if (cancelled) return;

        sessionStorage.removeItem('examforgeSession');
        setSession(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function showComingSoon(feature) {
    setNotice(
      `${feature} will be available in a later development stage.`
    );
  }

  function handleAuthSuccess(result, message) {
    if (result) {
      const nextSession = {
        token: result.token,
        user: result.user,
      };

      sessionStorage.setItem(
        'examforgeSession',
        JSON.stringify(nextSession)
      );
      setSession(nextSession);
      setAuthMode(null);
      setNotice(`Welcome, ${result.user.name}!`);
    } else {
      setAuthMode('login');
      setNotice(message);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('examforgeSession');
    setSession(null);
    setAuthMode(null);
    setMenuOpen(false);
    setNotice('You have logged out successfully.');
  }

  if (session) return <Dashboard session={session} onLogout={handleLogout} onNotice={setNotice} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#home"
          aria-label="ExamForge home"
        >
          <span className="brand-mark">
            <BookOpenCheck size={21} />
          </span>
          <span>
            exam<span className="brand-light">forge</span>
          </span>
        </a>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav
          className={menuOpen ? 'nav-links nav-open' : 'nav-links'}
          aria-label="Main navigation"
        >
          <a href="#features" onClick={() => setMenuOpen(false)}>
            Features
          </a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            About
          </a>

          {session ? (
            <>
              <span className="nav-user">
                Hi, {session.user?.name || 'User'}
                {session.user?.role === 'creator' ? ' · Creator' : ''}
              </span>
              <button
                className="btn btn-outline nav-login"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-outline nav-login"
                onClick={() => {
                  setAuthMode('login');
                  setMenuOpen(false);
                }}
              >
                Log in
              </button>
              <button
                className="btn btn-primary nav-cta"
                onClick={() => {
                  setAuthMode('register');
                  setMenuOpen(false);
                }}
              >
                Get started <ArrowRight size={16} />
              </button>
            </>
          )}
        </nav>
      </header>

      <main id="home">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} /> YOUR NEXT STEP STARTS HERE
            </div>

            <h1>
              Prepare smarter.
              <br />
              <span>Perform stronger.</span>
            </h1>

            <p className="hero-text">
              A calmer way to practice, take online exams, and turn
              every attempt into progress. Everything you need to learn
              with confidence, in one place.
            </p>

            <div className="hero-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={() =>
                  session
                    ? showComingSoon('Practice zone')
                    : setAuthMode('login')
                }
              >
                Explore practice <ArrowRight size={18} />
              </button>
              <a className="text-link" href="#how-it-works">
                See how it works <span>↗</span>
              </a>
            </div>

            <div className="trust-line">
              <span className="avatar-stack">
                <i>S</i>
                <i>A</i>
                <i>R</i>
              </span>
              <span>Built for focused learning and fair assessment</span>
            </div>
          </div>

          <div
            className="hero-visual"
            aria-label="Illustration of an online exam dashboard"
          >
            <div className="orb orb-one"></div>
            <div className="orb orb-two"></div>

            <div className="dashboard-card">
              <div className="dash-top">
                <div>
                  <span className="tiny-label">
                    YOUR LEARNING SPACE
                  </span>
                  <h3>Ready when you are.</h3>
                </div>
                <span className="status-dot" title="Preview" />
              </div>

              <div className="progress-panel">
                <div className="progress-head">
                  <span>Weekly progress</span>
                  <strong>Keep going</strong>
                </div>
                <div className="progress-bars">
                  <i style={{ height: '35%' }} />
                  <i style={{ height: '57%' }} />
                  <i style={{ height: '44%' }} />
                  <i style={{ height: '78%' }} />
                  <i style={{ height: '61%' }} />
                  <i style={{ height: '92%' }} />
                  <i style={{ height: '70%' }} />
                </div>
                <div className="week-labels">
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                  <span>S</span>
                </div>
              </div>

              <div className="next-exam">
                <span className="exam-icon">
                  <Target size={19} />
                </span>
                <div className="next-exam-copy">
                  <strong>Your next goal</strong>
                  <span>Practice a little every day</span>
                </div>
                <span className="mini-arrow">
                  <ArrowRight size={17} />
                </span>
              </div>

              <div className="floating-badge">
                <span>
                  <CheckCircle2 size={17} />
                </span>
                <div>
                  <strong>One step at a time</strong>
                  <small>Progress adds up</small>
                </div>
              </div>
            </div>

            <div className="decor-dot dot-a" />
            <div className="decor-dot dot-b" />
            <div className="decor-dot dot-c" />
          </div>
        </section>

        <section
          className="value-strip section-wrap"
          aria-label="Platform highlights"
        >
          <div>
            <ShieldCheck size={19} />
            <span>Designed with security in mind</span>
          </div>
          <div>
            <GraduationCap size={20} />
            <span>Made for students and creators</span>
          </div>
          <div>
            <ChartNoAxesCombined size={19} />
            <span>Progress you can understand</span>
          </div>
        </section>

        <section className="features-section section-wrap" id="features">
          <div className="section-heading">
            <div className="eyebrow centered-eyebrow">
              EVERYTHING IN ONE PLACE
            </div>
            <h2>
              Tools to help you <span>move forward.</span>
            </h2>
            <p>
              From your first practice question to the final result,
              make each step count.
            </p>
          </div>

          <div className="feature-grid">
            {features.map(({ icon: Icon, title, text }) => (
              <article className="feature-card" key={title}>
                <div className="feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <button
                  className="card-link"
                  onClick={() => showComingSoon(title)}
                >
                  Learn more <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="workflow-section" id="how-it-works">
          <div className="section-wrap workflow-inner">
            <div className="workflow-copy">
              <div className="eyebrow eyebrow-light">
                SIMPLE BY DESIGN
              </div>
              <h2>
                A clearer path from
                <br />
                practice to progress.
              </h2>
              <p>
                Spend less time figuring out the platform and more time
                building your confidence.
              </p>
              <button
                className="btn btn-white"
                onClick={() => showComingSoon('Dashboard')}
              >
                Discover the platform <ArrowRight size={16} />
              </button>
            </div>

            <div className="steps-list">
              <div className="step">
                <span>01</span>
                <div>
                  <h3>Choose your goal</h3>
                  <p>Find a practice topic or join an exam with a code.</p>
                </div>
              </div>
              <div className="step">
                <span>02</span>
                <div>
                  <h3>Focus on the questions</h3>
                  <p>
                    Work through MCQs in a clean, distraction-light space.
                  </p>
                </div>
              </div>
              <div className="step">
                <span>03</span>
                <div>
                  <h3>Review and improve</h3>
                  <p>
                    Use your results to see what you've learned and what
                    comes next.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bottom-cta section-wrap" id="about">
          <div className="cta-icon">
            <Users size={25} />
          </div>
          <div>
            <h2>Make your next attempt count.</h2>
            <p>Practice, assess, learn, repeat — one step at a time.</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() =>
              setAuthMode(session ? 'login' : 'register')
            }
          >
            {session ? 'Open account' : 'Get started'}
            <ArrowRight size={17} />
          </button>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-mark">
            <BookOpenCheck size={18} />
          </span>
          <span>
            exam<span className="brand-light">forge</span>
          </span>
        </a>
        <span>Learn. Practice. Excel.</span>
        <span>
          © {new Date().getFullYear()} ExamForge · BWT project
        </span>
      </footer>

      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button
            onClick={() => setNotice('')}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSuccess={handleAuthSuccess}
          onSwitch={() =>
            setAuthMode(authMode === 'login' ? 'register' : 'login')
          }
        />
      )}
    </div>
  );
}