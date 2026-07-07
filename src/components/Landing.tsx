"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageCircle, Menu, X, Languages, ArrowRight, Check,
  Users, Clock, Video, GraduationCap, Sparkles, Target,
  Quote, Mail, Phone, MapPin, Star,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

/* ─────────────────────────────────────────────────────────────────────────────
   SITE CONFIG — edit these with your real details.
   • WHATSAPP_NUMBER: international format, digits only (country + area + number).
     e.g. Brazil (55) São Paulo (11) 99999-9999  →  "5511999999999"
   • STATS: placeholder figures — replace with your real numbers.
   ──────────────────────────────────────────────────────────────────────────── */
const WHATSAPP_NUMBER = "5599999999999"; // TODO: replace with the school's real WhatsApp number
const CONTACT_EMAIL = "contato@speakup.com.br"; // TODO: replace
const INSTAGRAM = "https://instagram.com/"; // TODO: replace or remove

type Lang = "pt" | "en";

const ACCENT = "#5c6bc0";
const ACCENT_LIGHT = "#7986cb";

/* Bilingual copy. Everything the page renders comes from here. */
const copy = {
  pt: {
    nav: { method: "Metodologia", why: "Diferenciais", reviews: "Depoimentos", contact: "Contato", student: "Área do aluno", cta: "Agende sua aula" },
    waMessage: "Olá! Vim pelo site e quero agendar uma aula experimental de inglês.",
    hero: {
      badge: "Aulas 100% conversação",
      title: "Sua fluência,",
      titleAccent: "sua liberdade.",
      subtitle: "Na Speak-Up você aprende inglês conversando desde a primeira aula — com horários flexíveis, turmas reduzidas e um método que parte do seu português para te levar à fluência.",
      cta1: "Agende sua aula experimental",
      cta2: "Conheça o método",
    },
    stats: [
      { value: "10+", label: "Anos de experiência" },
      { value: "500+", label: "Alunos transformados" },
      { value: "100%", label: "Foco em conversação" },
      { value: "4.9★", label: "Avaliação dos alunos" },
    ],
    whyTitle: "Por que a Speak-Up?",
    whySubtitle: "Um jeito de aprender inglês feito para a sua rotina.",
    why: [
      { icon: MessageCircle, title: "100% conversação", text: "Você fala inglês desde a primeira aula. Nada de decorar regras: aqui o foco é comunicar com confiança." },
      { icon: Clock, title: "Horários flexíveis", text: "Aulas que se encaixam na sua rotina — manhã, tarde ou noite, presencial ou online." },
      { icon: Users, title: "Turmas reduzidas", text: "No máximo 5 alunos por turma, para você ter atenção de verdade e mais tempo de fala." },
      { icon: Target, title: "Método exclusivo", text: "Um caminho estruturado que parte do português para acelerar seu aprendizado do inglês." },
    ],
    methodTitle: "Como funciona",
    methodSubtitle: "Da primeira conversa à fluência, com um caminho claro.",
    methodSteps: [
      { icon: GraduationCap, title: "1. Aula experimental", text: "Você conhece seu professor, define seus objetivos e já sai falando inglês na primeira aula." },
      { icon: Sparkles, title: "2. Plano personalizado", text: "Montamos uma trilha de lições, áudios e quizzes no seu ritmo, com material próprio da Speak-Up." },
      { icon: Video, title: "3. Prática constante", text: "Aulas ao vivo, presenciais ou online, com correção e prática de conversação toda semana." },
    ],
    methodPoints: [
      "Confiança para falar desde a lição 1",
      "Material próprio com áudios e exercícios",
      "Professores que inspiram e acompanham você",
      "Presencial ou 100% online — você escolhe",
    ],
    reviewsTitle: "Quem estuda, recomenda",
    reviewsSubtitle: "Histórias reais de alunos que transformaram a relação com o inglês.",
    reviews: [
      { name: "Larissa M.", role: "Analista de Marketing", text: "Em poucos meses saí do 'travo na hora de falar' para conduzir reuniões em inglês. As turmas pequenas fazem toda a diferença." },
      { name: "Felipe R.", role: "Desenvolvedor", text: "O método é direto ao ponto: você fala o tempo todo. Consegui a vaga internacional que eu queria." },
      { name: "Isadora T.", role: "Estudante", text: "Viajei sozinha pela Europa sem medo de me comunicar. Os professores são incríveis e super atenciosos." },
    ],
    ctaBand: { title: "Transforme sua vida através do inglês.", text: "Comece hoje com uma aula experimental gratuita. Fale com a gente pelo WhatsApp.", button: "Falar no WhatsApp" },
    contactTitle: "Fale com a gente",
    contactSubtitle: "Tire suas dúvidas ou agende sua aula experimental. Respondemos rapidinho.",
    contactWa: "Chamar no WhatsApp",
    contactEmail: "Enviar e-mail",
    studentCta: { title: "Já é aluno?", text: "Acesse suas lições, áudios e quizzes.", button: "Entrar na área do aluno" },
    footerTagline: "Inglês com liberdade, conversação e flexibilidade.",
    footerRights: "Todos os direitos reservados.",
    footerLinks: "Navegação",
    footerContact: "Contato",
  },
  en: {
    nav: { method: "Method", why: "Why us", reviews: "Reviews", contact: "Contact", student: "Student area", cta: "Book a class" },
    waMessage: "Hi! I came from the website and I'd like to book a trial English class.",
    hero: {
      badge: "100% conversation-based classes",
      title: "Your fluency,",
      titleAccent: "your freedom.",
      subtitle: "At Speak-Up you learn English by speaking from day one — with flexible schedules, small groups, and a method that starts from your Portuguese to take you all the way to fluency.",
      cta1: "Book your free trial class",
      cta2: "See the method",
    },
    stats: [
      { value: "10+", label: "Years of experience" },
      { value: "500+", label: "Students transformed" },
      { value: "100%", label: "Conversation focused" },
      { value: "4.9★", label: "Student rating" },
    ],
    whyTitle: "Why Speak-Up?",
    whySubtitle: "A way to learn English built around your routine.",
    why: [
      { icon: MessageCircle, title: "100% conversation", text: "You speak English from your very first class. No memorizing rules — the focus is communicating with confidence." },
      { icon: Clock, title: "Flexible schedule", text: "Classes that fit your routine — morning, afternoon or evening, in person or online." },
      { icon: Users, title: "Small groups", text: "Up to 5 students per class, so you get real attention and much more speaking time." },
      { icon: Target, title: "Exclusive method", text: "A structured path that starts from Portuguese to speed up how you learn English." },
    ],
    methodTitle: "How it works",
    methodSubtitle: "From your first conversation to fluency, with a clear path.",
    methodSteps: [
      { icon: GraduationCap, title: "1. Trial class", text: "Meet your teacher, set your goals, and start speaking English in your very first class." },
      { icon: Sparkles, title: "2. Personalized plan", text: "We build a track of lessons, audio and quizzes at your pace, with Speak-Up's own material." },
      { icon: Video, title: "3. Constant practice", text: "Live classes, in person or online, with feedback and conversation practice every week." },
    ],
    methodPoints: [
      "Confidence to speak from lesson 1",
      "Own material with audio and exercises",
      "Teachers who inspire and guide you",
      "In person or 100% online — you choose",
    ],
    reviewsTitle: "Students recommend it",
    reviewsSubtitle: "Real stories from students who transformed their relationship with English.",
    reviews: [
      { name: "Larissa M.", role: "Marketing Analyst", text: "In a few months I went from freezing up to leading meetings in English. The small groups make all the difference." },
      { name: "Felipe R.", role: "Developer", text: "The method is straight to the point: you speak the whole time. I landed the international role I wanted." },
      { name: "Isadora T.", role: "Student", text: "I traveled solo across Europe with no fear of speaking. The teachers are amazing and so attentive." },
    ],
    ctaBand: { title: "Transform your life through English.", text: "Start today with a free trial class. Talk to us on WhatsApp.", button: "Chat on WhatsApp" },
    contactTitle: "Get in touch",
    contactSubtitle: "Ask us anything or book your trial class. We reply fast.",
    contactWa: "Message on WhatsApp",
    contactEmail: "Send an email",
    studentCta: { title: "Already a student?", text: "Access your lessons, audio and quizzes.", button: "Go to student area" },
    footerTagline: "English with freedom, conversation and flexibility.",
    footerRights: "All rights reserved.",
    footerLinks: "Navigation",
    footerContact: "Contact",
  },
} satisfies Record<Lang, unknown>;

function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/* Plain <img> for our own static brand assets (logo + speech bubbles).
   next/image's optimizer adds nothing for these small transparent PNGs. */
function Img(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} />;
}

export default function Landing() {
  const [lang, setLang] = useState<Lang>("pt");
  const [menuOpen, setMenuOpen] = useState(false);

  // Restore saved language after mount (SSR renders pt to avoid hydration mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("landing-lang") as Lang | null;
      // Sync from persisted preference after SSR (renders "pt") to avoid a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "pt" || saved === "en") setLang(saved);
    } catch {}
  }, []);

  function toggleLang() {
    const next: Lang = lang === "pt" ? "en" : "pt";
    setLang(next);
    try { localStorage.setItem("landing-lang", next); } catch {}
  }

  const t = copy[lang];
  const wa = waLink(t.waMessage);

  const navItems = [
    { href: "#method", label: t.nav.method },
    { href: "#why", label: t.nav.why },
    { href: "#reviews", label: t.nav.reviews },
    { href: "#contact", label: t.nav.contact },
  ];

  const sectionStyle = { scrollMarginTop: "5rem" } as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--navy)" }}>
      {/* ─── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50" style={{ backgroundColor: "var(--navy-card)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <a href="#top" className="flex items-center mr-2 shrink-0">
            <Img src="/logo.png" alt="Speak-Up English" className="h-9 w-auto" />
          </a>

          <div className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:text-[var(--text)]"
                style={{ color: "var(--text-muted)" }}>
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={toggleLang} title="PT / EN"
              className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold transition-all"
              style={{ color: "var(--text-muted)", backgroundColor: "var(--elev-1)" }}>
              <Languages size={15} />
              {lang.toUpperCase()}
            </button>
            <ThemeToggle />
            <Link href="/dashboard"
              className="hidden sm:inline-flex text-sm font-medium px-3 py-2 rounded-lg transition-colors hover:text-[var(--text)]"
              style={{ color: "var(--text-muted)" }}>
              {t.nav.student}
            </Link>
            <a href={wa} target="_blank" rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white transition hover:opacity-90"
              style={{ backgroundColor: ACCENT }}>
              {t.nav.cta}
            </a>
            <button onClick={() => setMenuOpen((v) => !v)} className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ color: "var(--text)", backgroundColor: "var(--elev-1)" }} aria-label="Menu">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-1 fade-in" style={{ borderTop: "1px solid var(--border)" }}>
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                {item.label}
              </a>
            ))}
            <Link href="/dashboard" onClick={() => setMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {t.nav.student}
            </Link>
            <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}
              className="mt-1 text-center text-sm font-semibold px-4 py-2.5 rounded-lg text-white" style={{ backgroundColor: ACCENT }}>
              {t.nav.cta}
            </a>
          </div>
        )}
      </nav>

      <main id="top" className="flex-1">
        {/* ─── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* backdrop glow */}
          <div className="pointer-events-none absolute inset-0" aria-hidden style={{
            background: `radial-gradient(60% 60% at 75% 20%, ${ACCENT}33 0%, transparent 60%)`,
          }} />
          <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
            <div className="fade-in">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
                style={{ backgroundColor: `${ACCENT}22`, color: ACCENT_LIGHT }}>
                <Sparkles size={13} /> {t.hero.badge}
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight" style={{ color: "var(--text)" }}>
                {t.hero.title}<br />
                <span style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_LIGHT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {t.hero.titleAccent}
                </span>
              </h1>
              <p className="mt-6 text-base md:text-lg leading-relaxed max-w-xl" style={{ color: "var(--text-muted)" }}>
                {t.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a href={wa} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl text-white transition hover:opacity-90 shadow-lg"
                  style={{ backgroundColor: ACCENT }}>
                  <MessageCircle size={17} /> {t.hero.cta1}
                </a>
                <a href="#method"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl transition hover:opacity-80"
                  style={{ color: "var(--text)", backgroundColor: "var(--elev-1)", border: "1px solid var(--border)" }}>
                  {t.hero.cta2} <ArrowRight size={16} />
                </a>
              </div>
            </div>

            {/* Artistic collage of the brand's colored speech bubbles */}
            <div className="relative hidden md:block h-[440px]" aria-hidden>
              <Img src="/bubbles/red.png" alt="Speak up!"
                className="absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 float-slow"
                style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.28))" }} />
              <Img src="/bubbles/yellow.png" alt=""
                className="absolute right-2 top-3 w-32 float-slower"
                style={{ filter: "drop-shadow(0 12px 20px rgba(0,0,0,0.22))" }} />
              <Img src="/bubbles/green.png" alt=""
                className="absolute left-0 bottom-6 w-36 float-slow"
                style={{ animationDelay: "1.2s", filter: "drop-shadow(0 12px 20px rgba(0,0,0,0.22))" }} />
              <Img src="/bubbles/blue.png" alt=""
                className="absolute left-4 top-2 w-24 float-slower"
                style={{ animationDelay: "0.6s", filter: "drop-shadow(0 10px 16px rgba(0,0,0,0.2))" }} />
              <div className="absolute right-4 bottom-4 rounded-2xl px-4 py-3 shadow-xl float-slow flex items-center gap-2"
                style={{ backgroundColor: "var(--navy-light)", border: "1px solid var(--border)", animationDelay: "0.9s" }}>
                <Star size={16} style={{ color: "#fbbf24" }} fill="#fbbf24" />
                <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>4.9 / 5.0</span>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="relative max-w-6xl mx-auto px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl p-6" style={{ backgroundColor: "var(--navy-card)", border: "1px solid var(--border)" }}>
              {t.stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-extrabold" style={{ color: ACCENT_LIGHT }}>{s.value}</div>
                  <div className="text-xs md:text-sm mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Why us ────────────────────────────────────────────────────── */}
        <section id="why" style={sectionStyle} className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "var(--text)" }}>{t.whyTitle}</h2>
            <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>{t.whySubtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {t.why.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl p-6 transition hover:-translate-y-1" style={{ backgroundColor: "var(--navy-card)", border: "1px solid var(--border)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${ACCENT}22` }}>
                  <Icon size={20} style={{ color: ACCENT_LIGHT }} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: "var(--text)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Method ────────────────────────────────────────────────────── */}
        <section id="method" style={sectionStyle} className="py-20" >
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "var(--text)" }}>{t.methodTitle}</h2>
              <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>{t.methodSubtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 mb-14">
              {t.methodSteps.map(({ icon: Icon, title, text }) => (
                <div key={title} className="relative rounded-2xl p-6" style={{ backgroundColor: "var(--navy-card)", border: "1px solid var(--border)" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})` }}>
                    <Icon size={20} color="white" />
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ color: "var(--text)" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{text}</p>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {t.methodPoints.map((p) => (
                <div key={p} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "var(--elev-1)" }}>
                  <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
                    <Check size={14} color="white" />
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Reviews ───────────────────────────────────────────────────── */}
        <section id="reviews" style={sectionStyle} className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "var(--text)" }}>{t.reviewsTitle}</h2>
            <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>{t.reviewsSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {t.reviews.map((r) => (
              <div key={r.name} className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: "var(--navy-card)", border: "1px solid var(--border)" }}>
                <Quote size={22} style={{ color: ACCENT_LIGHT }} />
                <p className="text-sm leading-relaxed my-4 flex-1" style={{ color: "var(--text)" }}>{r.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})` }}>
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{r.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-faint)" }}>{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA band ──────────────────────────────────────────────────── */}
        <section className="px-4 py-10">
          <div className="max-w-5xl mx-auto rounded-3xl px-6 py-14 md:py-16 text-center relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_LIGHT})` }}>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white max-w-2xl mx-auto leading-tight">{t.ctaBand.title}</h2>
            <p className="mt-4 text-white/90 text-base max-w-xl mx-auto">{t.ctaBand.text}</p>
            <a href={wa} target="_blank" rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-xl bg-white transition hover:opacity-90"
              style={{ color: ACCENT }}>
              <MessageCircle size={17} /> {t.ctaBand.button}
            </a>
          </div>
        </section>

        {/* ─── Contact ───────────────────────────────────────────────────── */}
        <section id="contact" style={sectionStyle} className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "var(--text)" }}>{t.contactTitle}</h2>
            <p className="mt-3 text-base max-w-md" style={{ color: "var(--text-muted)" }}>{t.contactSubtitle}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href={wa} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl text-white transition hover:opacity-90"
                style={{ backgroundColor: ACCENT }}>
                <Phone size={16} /> {t.contactWa}
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl transition hover:opacity-80"
                style={{ color: "var(--text)", backgroundColor: "var(--elev-1)", border: "1px solid var(--border)" }}>
                <Mail size={16} /> {t.contactEmail}
              </a>
            </div>
            <div className="mt-6 flex flex-col gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-2"><Mail size={14} /> {CONTACT_EMAIL}</span>
              <span className="flex items-center gap-2"><MapPin size={14} /> {lang === "pt" ? "Presencial e online" : "In person & online"}</span>
            </div>
          </div>

          {/* Student area callout */}
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: "var(--navy-card)", border: "1px solid var(--border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${ACCENT}22` }}>
              <GraduationCap size={24} style={{ color: ACCENT_LIGHT }} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>{t.studentCta.title}</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{t.studentCta.text}</p>
            <Link href="/dashboard"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition hover:opacity-90 text-white"
              style={{ backgroundColor: ACCENT }}>
              {t.studentCta.button} <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: "var(--navy-card)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-4 py-12 grid sm:grid-cols-3 gap-8">
          <div>
            <div className="mb-3">
              <Img src="/logo.png" alt="Speak-Up English" className="h-10 w-auto" />
            </div>
            <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>{t.footerTagline}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>{t.footerLinks}</h4>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
              {navItems.map((item) => (
                <li key={item.href}><a href={item.href} className="hover:text-[var(--text)] transition-colors">{item.label}</a></li>
              ))}
              <li><Link href="/dashboard" className="hover:text-[var(--text)] transition-colors">{t.nav.student}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text)" }}>{t.footerContact}</h4>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <li><a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text)] transition-colors">WhatsApp</a></li>
              <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[var(--text)] transition-colors">{CONTACT_EMAIL}</a></li>
              <li><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text)] transition-colors">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          <div className="max-w-6xl mx-auto px-4 py-5 text-center text-xs" style={{ color: "var(--text-faint)" }}>
            © {new Date().getFullYear()} Speak-Up English. {t.footerRights}
          </div>
        </div>
      </footer>
    </div>
  );
}
