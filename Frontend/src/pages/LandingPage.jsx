import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  Sparkles,
  FileText,
  UploadCloud,
  MessageSquare,
  Layers,
  HelpCircle,
  ArrowRight,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Zap,
  Target,
  Search,
  CheckCircle2,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import '../styles/landing.css';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(auth);
  }, []);

  return (
    <div className="landing-container">
      {/* ===================== NAVBAR ===================== */}
      <header className="landing-navbar">
        <div className="landing-nav-inner">
          {/* Left: Project Brand Logo */}
          <Link to="/" className="landing-brand">
            <div className="landing-brand-icon">
              <img
                src="/logo-128.png"
                alt="AiKMS Logo"
                className="landing-logo-img"
              />
            </div>
            <span className="landing-brand-title">AiKMS</span>
          </Link>

          {/* Center: Anchor Navigation Links (Desktop) */}
          <nav className="landing-nav-links">
            <a href="#about" className="landing-nav-link">What is AiKMS</a>
            <a href="#features" className="landing-nav-link">Why Use It</a>
            <a href="#audience" className="landing-nav-link">Who It's For</a>
            <a href="#how-it-works" className="landing-nav-link">How It Works</a>
          </nav>

          {/* Right: Auth Action Buttons */}
          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-landing-primary">
                Go to Workspace <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-landing-login">
                  Log in
                </Link>
                <Link to="/signup" className="btn-landing-signup">
                  Sign up
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="landing-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="landing-mobile-dropdown">
            <a
              href="#about"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              What is AiKMS
            </a>
            <a
              href="#features"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Why Use It
            </a>
            <a
              href="#audience"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Who It's For
            </a>
            <a
              href="#how-it-works"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <div className="mobile-auth-actions">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn-mobile-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Go to Workspace
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn-mobile-secondary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-mobile-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ===================== HERO SECTION ===================== */}
      <section className="landing-hero">
        <div className="hero-glow-blob hero-glow-1" />
        <div className="hero-glow-blob hero-glow-2" />

        <div className="landing-content-wrapper hero-inner">
          {/* Badge */}
          <div className="hero-badge">
            <Sparkles size={14} className="hero-badge-icon" />
            <span>AI Knowledge Management System</span>
          </div>

          {/* Bold Notion-Style Headline */}
          <h1 className="hero-headline">
            Where study materials and AI
            <span className="hero-pill-badge">
              <span className="hero-pill-dot" />
              Learn together.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Transform passive lecture slides, textbooks, and research papers into an
            interactive, high-retention workspace. Grounded RAG AI chat, autonomous
            curriculum extraction, spaced revision flashcards, and instant MCQ practice.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta-group">
            <Link to="/signup" className="btn-hero-primary">
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn-hero-secondary">
              <span>See How It Works</span>
              <ChevronDown size={18} />
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="hero-trust-bar">
            <div className="trust-item">
              <CheckCircle2 size={15} className="trust-icon" />
              <span>Zero Hallucination RAG</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={15} className="trust-icon" />
              <span>Multi-Format Ingestion</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={15} className="trust-icon" />
              <span>Google Gemini 2.5 Flash</span>
            </div>
          </div>

          {/* ===================== HERO WORKSPACE MOCKUP ===================== */}
          <div className="hero-mockup-container">
            <div className="mockup-frame">
              {/* Window Controls Topbar */}
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span className="mockup-dot red" />
                  <span className="mockup-dot yellow" />
                  <span className="mockup-dot green" />
                </div>
                <div className="mockup-title">
                  <FileText size={13} className="mockup-title-icon" />
                  <span>AiKMS Workspace — Operating_Systems_Lectures.pdf</span>
                </div>
                <div className="mockup-badge">Active Vault</div>
              </div>

              {/* Mockup Body: Two Column Study Workspace */}
              <div className="mockup-body">
                {/* Left Mini-Rail: Subjects & Curriculum */}
                <div className="mockup-sidebar">
                  <div className="mockup-sidebar-header">
                    <BookOpen size={14} />
                    <span>My Vaults</span>
                  </div>
                  <div className="mockup-vault-item active">
                    <div className="vault-item-top">
                      <span className="vault-name">Operating Systems</span>
                      <span className="vault-pct">82%</span>
                    </div>
                    <div className="vault-bar-bg">
                      <div className="vault-bar-fill" style={{ width: '82%' }} />
                    </div>
                  </div>
                  <div className="mockup-vault-item">
                    <div className="vault-item-top">
                      <span className="vault-name">Computer Networks</span>
                      <span className="vault-pct">45%</span>
                    </div>
                    <div className="vault-bar-bg">
                      <div className="vault-bar-fill" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div className="mockup-vault-item">
                    <div className="vault-item-top">
                      <span className="vault-name">Distributed Systems</span>
                      <span className="vault-pct">60%</span>
                    </div>
                    <div className="vault-bar-bg">
                      <div className="vault-bar-fill" style={{ width: '60%' }} />
                    </div>
                  </div>

                  <div className="mockup-sidebar-divider" />
                  <div className="mockup-mini-features">
                    <div className="mini-feature-tag">
                      <Layers size={13} /> 12 Chapters Extracted
                    </div>
                    <div className="mini-feature-tag">
                      <Sparkles size={13} /> 24 Flashcards Ready
                    </div>
                  </div>
                </div>

                {/* Right Area: Grounded AI Conversation & Active Recall */}
                <div className="mockup-chat-area">
                  {/* User Message */}
                  <div className="mockup-message user">
                    <div className="mockup-msg-content">
                      Explain the key difference between Paging and Segmentation in OS memory management.
                    </div>
                  </div>

                  {/* AI Response Grounded in PDF */}
                  <div className="mockup-message ai">
                    <div className="mockup-ai-avatar">
                      <Brain size={16} />
                    </div>
                    <div className="mockup-ai-content">
                      <p>
                        Based on <strong>Chapter 8 (Memory Management)</strong> of your uploaded notes:
                      </p>
                      <ul className="mockup-ai-list">
                        <li>
                          <strong>Paging</strong> divides physical memory into fixed-size frames and logical memory into same-sized pages. It completely eliminates external fragmentation.
                        </li>
                        <li>
                          <strong>Segmentation</strong> divides memory into variable-sized logical segments matching the user program perspective (code, stack, heap).
                        </li>
                      </ul>
                      {/* Citation Chip */}
                      <div className="mockup-citation">
                        <FileText size={12} />
                        <span>Source: Operating_Systems_Lectures.pdf • Page 142</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Recall Floating Widgets Preview */}
                  <div className="mockup-recall-strip">
                    <div className="recall-card flashcard-preview">
                      <div className="recall-card-header">
                        <Layers size={13} />
                        <span>AI Flashcard Deck</span>
                      </div>
                      <div className="recall-card-prompt">
                        "What hardware mechanism handles virtual-to-physical address translation?"
                      </div>
                      <span className="recall-badge">Flip to reveal (MMU)</span>
                    </div>

                    <div className="recall-card quiz-preview">
                      <div className="recall-card-header">
                        <HelpCircle size={13} />
                        <span>AI Practice Quiz</span>
                      </div>
                      <div className="recall-card-prompt">
                        Which page replacement policy suffers from Belady's Anomaly?
                      </div>
                      <div className="quiz-opt-correct">
                        <CheckCircle2 size={13} /> FIFO Page Replacement (Correct)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SECTION 1: WHAT OUR PRODUCT IS ===================== */}
      <section id="about" className="landing-section">
        <div className="landing-content-wrapper">
          <div className="landing-section-header">
            <span className="landing-section-pill">Product Architecture</span>
            <h2 className="landing-section-title">What is AiKMS?</h2>
            <p className="landing-section-subtitle">
              An intelligent, privacy-first personal learning workspace that converts static study
              materials into a dynamic, context-grounded AI knowledge companion.
            </p>
          </div>

          <div className="features-grid-4">
            {/* Card 1 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <UploadCloud size={24} className="feature-icon" />
              </div>
              <h3 className="feature-card-title">Universal Document Ingestion</h3>
              <p className="feature-card-desc">
                Upload lecture slides, textbooks, research papers, and syllabi in PDF, PPT, PPTX,
                DOCX, TXT, and Markdown up to 20MB. Automatically cleaned and parsed.
              </p>
            </div>

            {/* Card 2 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Brain size={24} className="feature-icon" />
              </div>
              <h3 className="feature-card-title">Context-Grounded RAG Engine</h3>
              <p className="feature-card-desc">
                Powered by Google Gemini 2.5 Flash and local ChromaDB semantic vector search.
                Every response is strictly grounded in your actual course materials with zero hallucination.
              </p>
            </div>

            {/* Card 3 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Target size={24} className="feature-icon" />
              </div>
              <h3 className="feature-card-title">Dynamic Curriculum Extractor</h3>
              <p className="feature-card-desc">
                AiKMS dynamically parses uploaded files to discover authentic chapters and subtopics,
                giving you a structured progress checklist to track your learning journey.
              </p>
            </div>

            {/* Card 4 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Sparkles size={24} className="feature-icon" />
              </div>
              <h3 className="feature-card-title">Active Recall & Assessment</h3>
              <p className="feature-card-desc">
                Automatically generate 3D perspective flip flashcards and timed 4-option multiple-choice
                quizzes directly from completed chapters to cement long-term memory.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SECTION 2: HOW IT IS USEFUL ===================== */}
      <section id="features" className="landing-section section-alternate">
        <div className="landing-content-wrapper">
          <div className="landing-section-header">
            <span className="landing-section-pill">Why Use AiKMS</span>
            <h2 className="landing-section-title">How It Elevates Your Study Routine</h2>
            <p className="landing-section-subtitle">
              Traditional studying is slow, passive, and fragmented. AiKMS introduces a proven
              comprehension flywheel that turns hours of reading into minutes of mastery.
            </p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon-box">
                <Search size={22} />
              </div>
              <div className="benefit-text">
                <h4>Stop Scouring 500-Page Slides</h4>
                <p>
                  Ask natural conversational questions and receive instantaneous, precise answers with
                  exact page numbers and source excerpts instead of hunting through folders.
                </p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-box">
                <Layers size={22} />
              </div>
              <div className="benefit-text">
                <h4>Structured Roadmaps, No Guesswork</h4>
                <p>
                  Unstructured documents are organized into hierarchical chapter outlines. Tick off
                  topics optimistically as you master them to see visual progress bars rise.
                </p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-box">
                <Zap size={22} />
              </div>
              <div className="benefit-text">
                <h4>Automated Spaced Repetition</h4>
                <p>
                  Never spend hours manually formatting flashcards. AiKMS synthesizes key concepts
                  and formula prompts from your notes with 3D flip animation and keyboard shortcuts.
                </p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-box">
                <HelpCircle size={22} />
              </div>
              <div className="benefit-text">
                <h4>Exam-Realistic Self-Assessments</h4>
                <p>
                  Generate timed 4-option practice quizzes tailored to your syllabus with instant
                  scoring, correct/wrong visual feedback, and comprehensive conceptual explanations.
                </p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-box">
                <BookOpen size={22} />
              </div>
              <div className="benefit-text">
                <h4>Scoped Vault Queries</h4>
                <p>
                  Scope your inquiries to a single subject vault or ask cross-disciplinary questions
                  spanning your entire personal library of notes.
                </p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-box">
                <ShieldCheck size={22} />
              </div>
              <div className="benefit-text">
                <h4>100% Private & User-Isolated</h4>
                <p>
                  Your study materials, notes, flashcards, and quizzes belong solely to you. Vector
                  embeddings and chat sessions are strictly sandboxed per account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SECTION 3: WHO USES IT ===================== */}
      <section id="audience" className="landing-section">
        <div className="landing-content-wrapper">
          <div className="landing-section-header">
            <span className="landing-section-pill">Target Users</span>
            <h2 className="landing-section-title">Who is AiKMS Built For?</h2>
            <p className="landing-section-subtitle">
              Engineered for anyone dealing with high volumes of technical, academic, or professional learning materials.
            </p>
          </div>

          <div className="audience-grid">
            {/* Persona 1 */}
            <div className="audience-card">
              <div className="audience-badge">Students</div>
              <div className="audience-icon-ring">
                <GraduationCap size={32} />
              </div>
              <h3>College & University Students</h3>
              <p>
                Cramming for midterms, synthesizing 40-slide lecture decks, tracking semester syllabi,
                and testing knowledge before finals with automated flashcards.
              </p>
              <ul className="audience-checklist">
                <li><CheckCircle2 size={14} /> Upload weekly class slides & handouts</li>
                <li><CheckCircle2 size={14} /> Clarify confusing theorems and proofs</li>
                <li><CheckCircle2 size={14} /> Review spaced flashcards on the go</li>
              </ul>
            </div>

            {/* Persona 2 */}
            <div className="audience-card">
              <div className="audience-badge">Researchers</div>
              <div className="audience-icon-ring">
                <Brain size={32} />
              </div>
              <h3>Academics & Researchers</h3>
              <p>
                Synthesizing dense scientific papers, extracting methodology trade-offs, and comparing
                findings across multiple literature sources in seconds.
              </p>
              <ul className="audience-checklist">
                <li><CheckCircle2 size={14} /> Ingest long arXiv papers and reviews</li>
                <li><CheckCircle2 size={14} /> Extract citations, algorithms & baselines</li>
                <li><CheckCircle2 size={14} /> Cross-reference multiple PDF studies</li>
              </ul>
            </div>

            {/* Persona 3 */}
            <div className="audience-card">
              <div className="audience-badge">Developers</div>
              <div className="audience-icon-ring">
                <Zap size={32} />
              </div>
              <h3>Engineers & Self-Learners</h3>
              <p>
                Mastering new frameworks, system design architectures, and programming languages
                through technical documentation and book summaries.
              </p>
              <ul className="audience-checklist">
                <li><CheckCircle2 size={14} /> Parse documentation, guides & RFCs</li>
                <li><CheckCircle2 size={14} /> Ask deep code and architectural questions</li>
                <li><CheckCircle2 size={14} /> Practice technical interview MCQs</li>
              </ul>
            </div>

            {/* Persona 4 */}
            <div className="audience-card">
              <div className="audience-badge">Candidates</div>
              <div className="audience-icon-ring">
                <Target size={32} />
              </div>
              <h3>Competitive Exam Aspirants</h3>
              <p>
                Preparing for standardized exams (GATE, GRE, USMLE, Bar Exam) requiring deep conceptual
                retention and extensive multiple-choice practice.
              </p>
              <ul className="audience-checklist">
                <li><CheckCircle2 size={14} /> Timed 4-option MCQ simulations</li>
                <li><CheckCircle2 size={14} /> Instant answer rationales & error analysis</li>
                <li><CheckCircle2 size={14} /> Spaced repetition for formula mastery</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SECTION 4: HOW TO USE IT ===================== */}
      <section id="how-it-works" className="landing-section section-alternate">
        <div className="landing-content-wrapper">
          <div className="landing-section-header">
            <span className="landing-section-pill">Simple Workflow</span>
            <h2 className="landing-section-title">How to Use AiKMS in 3 Steps</h2>
            <p className="landing-section-subtitle">
              Get from raw PDF files to an active conversational learning deck in under two minutes.
            </p>
          </div>

          <div className="steps-container">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-number-tag">01</div>
              <div className="step-icon-wrapper">
                <UploadCloud size={28} />
              </div>
              <h3 className="step-title">Upload Your Study Materials</h3>
              <p className="step-desc">
                Drag and drop your textbooks, lecture presentations, or lecture notes. AiKMS automatically
                sanitizes text, creates semantic chunks, and builds isolated vector embeddings.
              </p>
              <div className="step-meta-badge">Supports PDF, PPTX, DOCX, TXT</div>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-number-tag">02</div>
              <div className="step-icon-wrapper">
                <Layers size={28} />
              </div>
              <h3 className="step-title">Explore Your Auto-Curriculum</h3>
              <p className="step-desc">
                Our AI topic extractor analyzes document structure to generate chapter hierarchies and
                subtopics. Mark items as completed to visualize your syllabus progress.
              </p>
              <div className="step-meta-badge">Hierarchical Chapters & Subtopics</div>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-number-tag">03</div>
              <div className="step-icon-wrapper">
                <MessageSquare size={28} />
              </div>
              <h3 className="step-title">Chat, Revise & Master</h3>
              <p className="step-desc">
                Converse with your documents using Gemini 2.5 Flash RAG, flip through 3D flashcards,
                and validate your understanding with timed multiple-choice practice quizzes.
              </p>
              <div className="step-meta-badge">Grounded Q&A • 3D Cards • AI Quizzes</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CALL TO ACTION BANNER ===================== */}
      <section className="landing-cta-banner">
        <div className="landing-content-wrapper cta-inner">
          <div className="cta-glow-blob" />
          <h2 className="cta-title">Ready to Transform How You Study?</h2>
          <p className="cta-subtitle">
            Join students, researchers, and learners turning static learning materials into an active,
            intelligent knowledge companion. Start free in 30 seconds.
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn-cta-primary">
              <span>Create Free Account</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-cta-secondary">
              <span>Log In to Workspace</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="landing-footer">
        <div className="landing-content-wrapper footer-inner">
          <div className="footer-left">
            <div className="footer-brand">
              <img
                src="/logo-128.png"
                alt="AiKMS"
                className="footer-logo-img"
              />
              <span className="footer-brand-title">AiKMS</span>
            </div>
            <p className="footer-tagline">
              Intelligent Personal Knowledge Management System. Context-grounded RAG study workspace.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-column">
              <h4>Navigation</h4>
              <a href="#about">What is AiKMS</a>
              <a href="#features">Why Use It</a>
              <a href="#audience">Who It's For</a>
              <a href="#how-it-works">How It Works</a>
            </div>

            <div className="footer-column">
              <h4>Workspace</h4>
              <Link to="/login">Sign In</Link>
              <Link to="/signup">Register</Link>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/chat">AI Chat</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="landing-content-wrapper footer-bottom-inner">
            <p>© {new Date().getFullYear()} AiKMS. All rights reserved.</p>
            <p className="footer-note">Designed for high-retention learning.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
