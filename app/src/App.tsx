import React, { useEffect, useMemo, useRef, useState } from "react";

type CycleId = "all" | "DAM" | "DAW" | "ASIR" | "SMR";

type Topic = {
  id: string;
  title: string;
  body: string;
  blocks?: Array<{ type: "h" | "p" | "ul" | "code"; text?: string; items?: string[] }>;
};

type Course = {
  id: string;
  title: string;
  cycles: Exclude<CycleId, "all">[];
  image?: string;
  inConstruction: boolean;
  objectives: string[];
  recommendations: string[];
  topics: Topic[];
};

const CYCLES: { id: CycleId; name: string }[] = [
  { id: "all", name: "Todos" },
  { id: "DAM", name: "DAM" },
  { id: "DAW", name: "DAW" },
  { id: "ASIR", name: "ASIR" },
  { id: "SMR", name: "SMR" },
];

const PYTHON_LOGO_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'>" +
  "<defs>" +
  "<linearGradient id='a' x1='0' x2='1' y1='0' y2='1'>" +
  "<stop offset='0' stop-color='#387EB8'/>" +
  "<stop offset='1' stop-color='#366994'/>" +
  "</linearGradient>" +
  "<linearGradient id='b' x1='0' x2='1' y1='1' y2='0'>" +
  "<stop offset='0' stop-color='#FFE052'/>" +
  "<stop offset='1' stop-color='#FFC331'/>" +
  "</linearGradient>" +
  "</defs>" +
  "<path fill='url(#a)' d='M128 20c-38 0-36 16-36 16v34h72V62s0-16-36-16zm-20 26a10 10 0 1 1 0 .1z'/>" +
  "<path fill='url(#a)' d='M92 70H56s-16 0-16 36 14 44 24 44h14V132H92v52s0 16 16 16h40s16 0 16-16v-30H92s-16 0-16-16v-16h72s36 4 36-36-32-36-32-36h-20v18H92z' opacity='0.98'/>" +
  "<path fill='url(#b)' d='M128 236c38 0 36-16 36-16v-34h-72v8s0 16 36 16zm20-26a10 10 0 1 1 0-.1z'/>" +
  "<path fill='url(#b)' d='M164 186h36s16 0 16-36-14-44-24-44h-14v18h-14V72s0-16-16-16h-40s-16 0-16 16v30h72s16 0 16 16v16H92s-36-4-36 36 32 36 32 36h20v-18h56z' opacity='0.98'/>" +
  "</svg>";
const PYTHON_LOGO = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(PYTHON_LOGO_SVG);

function normalize(str: string) {
  const s = (str || "").toLowerCase().normalize("NFD");
  let out = "";
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    const cp = ch.codePointAt(0);
    const code = cp == null ? 0 : cp;
    if (code < 0x0300 || code > 0x036f) out += ch;
  }
  return out;
}

function hashStr(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function cycleAccent(cycle: string) {
  if (cycle === "DAM") return { a: "#6366F1", b: "#22C55E" };
  if (cycle === "DAW") return { a: "#0EA5E9", b: "#6366F1" };
  if (cycle === "ASIR") return { a: "#F59E0B", b: "#EF4444" };
  if (cycle === "SMR") return { a: "#10B981", b: "#0EA5E9" };
  return { a: "#64748B", b: "#94A3B8" };
}

function courseImageDataUri(course: Course) {
  const primaryCycle = course.cycles[0] || "";
  const colors = cycleAccent(primaryCycle);
  const seed = hashStr(course.id + "|" + course.title + "|" + primaryCycle);

  const c1x = 820 + (seed % 320);
  const c1y = 120 + ((seed >>> 8) % 180);
  const c1r = 190 + ((seed >>> 16) % 140);

  const c2x = 180 + ((seed >>> 4) % 360);
  const c2y = 520 + ((seed >>> 12) % 160);
  const c2r = 210 + ((seed >>> 20) % 160);

  const c3x = 560 + ((seed >>> 6) % 320);
  const c3y = 320 + ((seed >>> 14) % 220);
  const c3r = 180 + ((seed >>> 22) % 140);

  const w1 = 470 + (seed % 90);
  const w2 = 590 + ((seed >>> 10) % 90);
  const w3 = 520 + ((seed >>> 18) % 90);

  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'>" +
    "<defs>" +
    "<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
    "<stop offset='0' stop-color='" +
    colors.a +
    "' stop-opacity='0.95'/>" +
    "<stop offset='1' stop-color='" +
    colors.b +
    "' stop-opacity='0.95'/>" +
    "</linearGradient>" +
    "<filter id='b' x='-25%' y='-25%' width='150%' height='150%'><feGaussianBlur stdDeviation='34'/></filter>" +
    "</defs>" +
    "<rect width='1200' height='675' fill='url(#g)'/>" +
    "<g filter='url(#b)'>" +
    "<circle cx='" +
    c1x +
    "' cy='" +
    c1y +
    "' r='" +
    c1r +
    "' fill='rgba(255,255,255,0.22)'/>" +
    "<circle cx='" +
    c2x +
    "' cy='" +
    c2y +
    "' r='" +
    c2r +
    "' fill='rgba(255,255,255,0.16)'/>" +
    "<circle cx='" +
    c3x +
    "' cy='" +
    c3y +
    "' r='" +
    c3r +
    "' fill='rgba(255,255,255,0.12)'/>" +
    "</g>" +
    "<path d='M0 " +
    w1 +
    " C 240 " +
    (w1 - 70) +
    ", 420 " +
    (w2 + 80) +
    ", 640 " +
    w2 +
    " C 860 " +
    (w2 - 80) +
    ", 980 " +
    (w3 + 90) +
    ", 1200 " +
    w3 +
    " L1200 675 L0 675 Z' fill='rgba(255,255,255,0.12)'/>" +
    "<path d='M0 " +
    (w1 + 90) +
    " C 260 " +
    (w2 + 40) +
    ", 520 " +
    (w3 + 120) +
    ", 760 " +
    (w2 + 70) +
    " C 980 " +
    (w3 + 40) +
    ", 1090 " +
    (w1 + 170) +
    ", 1200 " +
    (w1 + 130) +
    " L1200 675 L0 675 Z' fill='rgba(0,0,0,0.06)'/>" +
    "</svg>";

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const PYTHON_TOPICS: Topic[] = Array.from({ length: 10 }).map((_, i) => ({
  id: "t" + (i + 1),
  title: `${i + 1}. Tema ${i + 1}`,
  body: "En construcción.",
}));

const COURSES: Course[] = [
  {
    id: "python-intro",
    title: "Introducción a la programación (PYTHON)",
    cycles: ["DAM", "DAW"],
    image: PYTHON_LOGO,
    inConstruction: false,
    objectives: [
      "Comprender la sintaxis básica y el flujo de un programa.",
      "Resolver problemas sencillos con variables, condicionales y bucles.",
      "Organizar código con funciones y colecciones.",
      "Aprender a depurar y manejar errores habituales.",
    ],
    recommendations: [
      "Sigue los temas en orden y practica al final de cada uno.",
      "Guarda tus ejercicios por tema (carpetas) y revisa tu progreso.",
      "Repite el mini proyecto cambiando requisitos para consolidar.",
    ],
    topics: PYTHON_TOPICS,
  },
  { id: "prog", title: "Programación", cycles: ["DAM", "DAW"], inConstruction: true, objectives: [], recommendations: [], topics: [] },
  { id: "lms", title: "Lenguajes de marcas y sistemas de gestión de información", cycles: ["DAM", "DAW", "ASIR"], inConstruction: true, objectives: [], recommendations: [], topics: [] },
  { id: "dam-acceso", title: "Acceso a datos", cycles: ["DAM"], inConstruction: true, objectives: [], recommendations: [], topics: [] },
  { id: "dam-sist", title: "Sistemas informáticos", cycles: ["DAM"], inConstruction: true, objectives: [], recommendations: [], topics: [] },
  { id: "daw-cliente", title: "Desarrollo web en entorno cliente", cycles: ["DAW"], inConstruction: true, objectives: [], recommendations: [], topics: [] },
  { id: "daw-servidor", title: "Desarrollo web en entorno servidor", cycles: ["DAW"], inConstruction: true, objectives: [], recommendations: [], topics: [] },
  { id: "asir-redes", title: "Planificación y administración de redes", cycles: ["ASIR"], inConstruction: true, objectives: [], recommendations: [], topics: [] },
  { id: "smr-ofimatica", title: "Aplicaciones ofimáticas", cycles: ["SMR"], inConstruction: true, objectives: [], recommendations: [], topics: [] },
];

function filterCourses(courses: Course[], query: string, cycle: CycleId) {
  const q = normalize(query).trim();
  return courses.filter((c) => {
    if (cycle !== "all") {
      if (c.cycles.indexOf(cycle as any) === -1) return false;
    }
    if (!q) return true;
    return normalize(c.title).includes(q);
  });
}

function sortCourses(list: Course[]) {
  const out = list.slice();
  out.sort((a, b) => {
    const ai = a.inConstruction ? 1 : 0;
    const bi = b.inConstruction ? 1 : 0;
    if (ai !== bi) return ai - bi;
    return a.title.localeCompare(b.title, "es", { sensitivity: "base" });
  });
  return out;
}

function useHashRouting() {
  const [hash, setHash] = useState(() => (typeof window === "undefined" ? "" : window.location.hash || ""));
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const set = (next: string) => {
    if (typeof window === "undefined") return;
    window.location.hash = next;
  };
  return { hash, set };
}

function parseHash(hash: string) {
  const clean = (hash || "").replace(/^#\/?/, "");
  const parts = clean.split("/").filter(Boolean);
  if (parts.length === 0) return { view: "catalog" as const };
  if (parts[0] === "course" && parts[1]) {
    if (parts[2] === "topic" && parts[3]) return { view: "topic" as const, courseId: parts[1], topicId: parts[3] };
    return { view: "course" as const, courseId: parts[1] };
  }
  return { view: "catalog" as const };
}

function Styles() {
  return (
    <style>{`
      :root{
        --border: rgba(15,23,42,0.10);
        --shadow: 0 10px 30px rgba(2,6,23,0.08);
        --text:#0f172a;
        --muted:#475569;
        --amber:#f59e0b;
      }
      *{box-sizing:border-box;}
      html,body{height:100%;}
      body{margin:0;font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color:var(--text);}
      .page{
        min-height:100vh;
        background:
          radial-gradient(ellipse at top, rgba(99,102,241,0.13), transparent 55%),
          radial-gradient(ellipse at bottom, rgba(16,185,129,0.10), transparent 60%),
          linear-gradient(180deg, #fbfdff, #f4f7ff);
        padding-bottom: 88px;
      }
      .header{
        position:sticky; top:0; z-index:50;
        border-bottom:1px solid var(--border);
        background:rgba(255,255,255,0.65);
        backdrop-filter: blur(10px);
      }
      .wrap{max-width:1160px;margin:0 auto;padding: 18px 16px;}
      .headerRow{display:flex;align-items:center;justify-content:space-between;gap:16px;}
      .brand{display:flex;align-items:center;gap:12px;min-width:0;}
      .brandIcon{width:44px;height:44px;border-radius:999px;background:rgba(255,255,255,0.85);border:1px solid var(--border);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;}
      .brandTitle{font-size:30px;font-weight:800;letter-spacing:-0.02em;white-space:nowrap;}
      .btn{
        height:44px; padding:0 14px; border-radius:16px;
        border:1px solid var(--border);
        background:rgba(255,255,255,0.80);
        box-shadow: 0 8px 18px rgba(2,6,23,0.06);
        font-weight:800;
        cursor:pointer;
        display:inline-flex;align-items:center;gap:8px;
      }
      .btn:hover{transform: translateY(-1px);}
      .btn:active{transform: translateY(0);}

      .controls{
        display:flex; align-items:center; gap:14px;
        padding: 18px 16px;
        max-width:1160px; margin:0 auto;
      }
      .search{
        flex:1;
        display:flex;align-items:center;gap:10px;
        background:rgba(255,255,255,0.75);
        border:1px solid var(--border);
        border-radius:22px;
        padding: 14px 14px;
        box-shadow: 0 8px 18px rgba(2,6,23,0.05);
      }
      .search input{
        width:100%; border:0; outline:none;
        background:transparent;
        font-size:18px;
      }
      .pills{
        display:grid;
        grid-template-columns: repeat(5, minmax(84px, 1fr));
        gap:10px;
        min-width: 460px;
      }
      .pill{
        height:54px;
        border-radius:22px;
        border:1px solid var(--border);
        background:rgba(255,255,255,0.75);
        box-shadow: 0 8px 18px rgba(2,6,23,0.05);
        font-weight:900;
        cursor:pointer;
      }
      .pill.active{outline:3px solid rgba(79,70,229,0.22);}

      .grid{
        max-width:1160px;margin:0 auto;padding: 10px 16px 22px;
        display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:18px;
      }

      .card{
        position:relative;
        border:1px solid var(--border);
        border-radius:28px;
        background:rgba(255,255,255,0.72);
        box-shadow: var(--shadow);
        overflow:hidden;
        min-height: 176px;
        cursor:pointer;
        transition: transform .15s ease;
      }
      .card:hover{transform: translateY(-2px);}
      .cardInner{display:flex; gap:16px; padding: 16px; align-items:stretch; height:100%;}
      .left{flex:1; min-width:0; padding-top: 52px; position:relative; display:flex; align-items:center;}
      .cycles{
        position:absolute; top:16px; left:16px;
        display:grid;
        grid-template-columns: repeat(3, minmax(60px, 1fr));
        gap:8px;
        max-width: 240px;
      }
      .cycleChip{
        border:1px solid var(--border);
        background:rgba(255,255,255,0.85);
        border-radius:999px;
        padding: 6px 10px;
        font-size:12px;
        font-weight:900;
        text-align:center;
      }
      .title{
        font-weight:900;
        letter-spacing:-0.02em;
        line-height:1.12;
        font-size: clamp(20px, 2.0vw, 34px);
        word-break: break-word;
      }
      .right{
        width: 44%;
        min-width: 150px;
        display:flex;
        align-items:center;
        justify-content:center;
      }
      .imgBox{
        width:100%;
        height: 100%;
        border-radius:22px;
        background: rgba(255,255,255,0.35);
        border:1px solid rgba(15,23,42,0.06);
        box-shadow: 0 10px 22px rgba(2,6,23,0.07);
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        padding: 10px;
      }
      .imgBox img{max-width:100%; max-height: 140px; object-fit: contain;}
      .imgCover img{width:100%; height:100%; object-fit: cover; max-height:none;}

      .badge{
        position:absolute;
        top:14px; right:14px;
        max-width: 92%;
        background: rgba(245, 158, 11, 0.96);
        color:white;
        padding: 10px 14px;
        border-radius: 18px;
        font-weight:900;
        font-size: 15px;
        box-shadow: 0 14px 24px rgba(245,158,11,0.25);
      }

      .courseMain{max-width:1160px;margin:0 auto;padding: 18px 16px;}
      .courseTop{display:grid; gap:16px; grid-template-columns: 1fr 1fr; align-items:stretch;}
      .panel{border:1px solid var(--border); border-radius:28px; background: rgba(255,255,255,0.72); box-shadow: var(--shadow);}
      .panelPad{padding:18px;}
      .panelTitle{font-size:14px;font-weight:900;}
      .list{margin:12px 0 0; padding-left: 18px; color: var(--muted); font-size:14px; line-height:1.7;}
      .courseImg{display:flex; align-items:center; justify-content:center; padding: 18px;}
      .courseImg img{max-width: 90%; max-height: 290px; object-fit: contain;}
      .indexTitle{font-size:20px;font-weight:900;letter-spacing:-0.02em;margin: 22px 0 10px;}
      .topicsGrid{display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px;}
      .topicBtn{width:100%; text-align:left; border:0; background:transparent; padding:0; cursor:pointer;}
      .topicCard{border:1px solid var(--border); border-radius:28px; background: rgba(255,255,255,0.72); box-shadow: var(--shadow); padding: 16px;}
      .topicTitle{font-size:14px; font-weight:900;}
      .topicBody{margin-top:6px; font-size:14px; color: var(--muted); line-height:1.6;}

      .topicWrap{max-width: 920px; margin: 0 auto; padding: 18px 16px;}
      .section{border:1px solid var(--border); border-radius:28px; background: rgba(255,255,255,0.72); box-shadow: var(--shadow); padding: 16px; margin-bottom: 14px;}
      .sectionH{font-size: clamp(18px, 1.6vw, 24px); font-weight: 900; letter-spacing:-0.02em;}
      .p{font-size:14px; color: var(--muted); line-height:1.75;}

      .footer{
        position:fixed; left:0; right:0; bottom:0; z-index:60;
        background: rgba(255,255,255,0.70);
        backdrop-filter: blur(10px);
        border-top:1px solid var(--border);
      }
      .footerInner{max-width:1160px;margin:0 auto;padding: 10px 12px; display:flex; gap:10px; overflow:auto;}
      .footBtn{white-space:nowrap; border-radius: 18px; border:1px solid var(--border); background: rgba(255,255,255,0.75); padding: 10px 12px; font-weight:900; cursor:pointer;}
      .footBtn.active{outline:3px solid rgba(79,70,229,0.22); background: rgba(255,255,255,0.95);}

      @media (max-width: 980px){
        .pills{min-width: 360px; grid-template-columns: repeat(5, minmax(70px, 1fr));}
        .grid{grid-template-columns: 1fr;}
        .courseTop{grid-template-columns: 1fr;}
        .topicsGrid{grid-template-columns: 1fr;}
      }

      @media (max-width: 740px){
        .controls{flex-direction:column; align-items:stretch;}
        .pills{min-width: 0; grid-template-columns: repeat(3, minmax(0, 1fr));}
        .search input{font-size:17px;}
        .cardInner{padding: 14px; gap:14px;}
        .right{width: 46%; min-width: 130px;}
        .imgBox img{max-height: 120px;}
        .cycles{grid-template-columns: repeat(3, minmax(54px, 1fr)); max-width: 210px;}
      }
    `}</style>
  );
}

function IconCap(p: { size?: number }) {
  const s = p.size || 22;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L2 8l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 10v6c0 2 3 4 6 4s6-2 6-4v-6" stroke="currentColor" strokeWidth="2" />
      <path d="M22 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch(p: { size?: number }) {
  const s = p.size || 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBack(p: { size?: number }) {
  const s = p.size || 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TopicsFooter(p: { topics: Topic[]; active: string; onJump: (id: string) => void }) {
  return (
    <div className="footer">
      <div className="footerInner">
        {p.topics.map((t) => (
          <button key={t.id} type="button" onClick={() => p.onJump(t.id)} className={p.active === t.id ? "footBtn active" : "footBtn"}>
            {t.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function CourseCard(p: { course: Course; onOpen: (id: string) => void }) {
  const c = p.course;
  const imgSrc = c.image || courseImageDataUri(c);
  const isPython = c.id === "python-intro";

  return (
    <div className="card" role="button" tabIndex={0} onClick={() => p.onOpen(c.id)} onKeyDown={() => p.onOpen(c.id)}>
      {c.inConstruction ? <div className="badge">En construcción: estamos trabajando para que el curso esté completo en breve.</div> : null}

      <div className="cardInner">
        <div className="left">
          <div className="cycles">
            {c.cycles.map((cy) => (
              <span key={cy} className="cycleChip">
                {cy}
              </span>
            ))}
          </div>
          <div className="title">{c.title}</div>
        </div>

        <div className="right">
          <div className={isPython ? "imgBox" : "imgBox imgCover"}>
            <img src={imgSrc} alt={c.title} loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Catalog(p: { onOpenCourse: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [cycle, setCycle] = useState<CycleId>("all");
  const filtered = useMemo(() => sortCourses(filterCourses(COURSES, query, cycle)), [query, cycle]);

  return (
    <div className="page">
      <div className="header">
        <div className="wrap">
          <div className="headerRow">
            <div className="brand">
              <div className="brandIcon">
                <IconCap />
              </div>
              <div className="brandTitle">Informática FP</div>
            </div>
          </div>
        </div>

        <div className="controls">
          <div className="search">
            <IconSearch />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar módulo por nombre..." aria-label="Buscar módulo por nombre" />
          </div>

          <div className="pills" aria-label="Filtrar por ciclo">
            {CYCLES.map((it) => (
              <button key={it.id} type="button" className={cycle === it.id ? "pill active" : "pill"} onClick={() => setCycle(it.id)}>
                {it.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid">
        {filtered.map((c) => (
          <CourseCard key={c.id} course={c} onOpen={p.onOpenCourse} />
        ))}
      </div>
    </div>
  );
}

function CourseHome(p: {
  course: Course;
  onBack: () => void;
  onOpenTopic: (topicId: string) => void;
  activeTopic: string;
  onJumpToIndex: (topicId: string) => void;
  indexRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) {
  const course = p.course;
  const topics = course.topics || [];
  const imgSrc = course.image || courseImageDataUri(course);

  return (
    <div className="page">
      <div className="header">
        <div className="wrap">
          <div className="headerRow">
            <div className="brand" style={{ minWidth: 0 }}>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{course.title}</div>
            </div>
            <button type="button" className="btn" onClick={p.onBack}>
              <IconBack /> Volver
            </button>
          </div>
        </div>
      </div>

      <div className="courseMain">
        <div className="courseTop">
          <div className="panel">
            <div className="panelPad">
              <div className="panelTitle">Objetivos</div>
              <ul className="list">
                {(course.objectives || []).map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="panel courseImg">
            <img src={imgSrc} alt="Imagen del curso" />
          </div>
        </div>

        <div style={{ marginTop: 14 }} className="panel">
          <div className="panelPad">
            <div className="panelTitle">Recomendación</div>
            <ul className="list">
              {(course.recommendations || []).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="indexTitle">Índice de temas</div>
        <div className="topicsGrid">
          {topics.map((t) => (
            <button key={t.id} type="button" className="topicBtn" onClick={() => p.onOpenTopic(t.id)}>
              <div
                ref={(el) => {
                  p.indexRefs.current[t.id] = el;
                }}
                className="topicCard"
              >
                <div className="topicTitle">{t.title}</div>
                <div className="topicBody">{t.body}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <TopicsFooter topics={topics} active={p.activeTopic} onJump={p.onJumpToIndex} />
    </div>
  );
}

function TopicPage(p: { course: Course; topic: Topic; onBackToCourse: () => void; onSelectTopic: (topicId: string) => void }) {
  const topics = p.course.topics || [];
  return (
    <div className="page">
      <div className="header">
        <div className="wrap">
          <div className="headerRow">
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, minWidth: 0 }}>{p.topic.title}</div>
            <button type="button" className="btn" onClick={p.onBackToCourse}>
              <IconBack /> Volver
            </button>
          </div>
        </div>
      </div>

      <div className="topicWrap">
        <div className="section">
          <div className="sectionH">En construcción</div>
          <div className="p" style={{ marginTop: 10 }}>
            Estamos trabajando para que el tema esté completo en breve.
          </div>
        </div>
      </div>

      <TopicsFooter topics={topics} active={p.topic.id} onJump={p.onSelectTopic} />
    </div>
  );
}

export default function App() {
  const routing = useHashRouting();
  const parsed = useMemo(() => parseHash(routing.hash), [routing.hash]);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const indexRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (parsed.view === "catalog") {
      setSelectedCourseId(null);
      setSelectedTopicId(null);
      return;
    }
    if (parsed.view === "course") {
      setSelectedCourseId(parsed.courseId);
      setSelectedTopicId(null);
      return;
    }
    if (parsed.view === "topic") {
      setSelectedCourseId(parsed.courseId);
      setSelectedTopicId(parsed.topicId);
    }
  }, [parsed.view, (parsed as any).courseId, (parsed as any).topicId]);

  const selectedCourse = useMemo(() => (selectedCourseId ? COURSES.find((c) => c.id === selectedCourseId) || null : null), [selectedCourseId]);
  const topics = selectedCourse?.topics || [];
  const activeTopic = selectedTopicId || (topics.length ? topics[0].id : "");
  const selectedTopic = useMemo(() => (selectedCourse && selectedTopicId ? topics.find((t) => t.id === selectedTopicId) || null : null), [
    selectedCourse,
    selectedTopicId,
    topics,
  ]);

  const openCourse = (id: string) => routing.set(`/course/${id}`);
  const goCatalog = () => routing.set(`/`);
  const openTopic = (topicId: string) => {
    if (!selectedCourseId) return;
    routing.set(`/course/${selectedCourseId}/topic/${topicId}`);
  };
  const backToCourse = () => {
    if (!selectedCourseId) return;
    routing.set(`/course/${selectedCourseId}`);
  };

  const jumpToIndex = (topicId: string) => {
    if (!selectedCourseId) return;
    if (selectedTopicId) {
      routing.set(`/course/${selectedCourseId}/topic/${topicId}`);
      return;
    }
    const el = indexRefs.current[topicId];
    if (el && typeof (el as any).scrollIntoView === "function") {
      (el as any).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <Styles />
      {selectedCourse ? (
        selectedTopic ? (
          <TopicPage course={selectedCourse} topic={selectedTopic} onBackToCourse={backToCourse} onSelectTopic={openTopic} />
        ) : (
          <CourseHome
            course={selectedCourse}
            onBack={goCatalog}
            onOpenTopic={openTopic}
            activeTopic={activeTopic}
            onJumpToIndex={jumpToIndex}
            indexRefs={indexRefs}
          />
        )
      ) : (
        <Catalog onOpenCourse={openCourse} />
      )}
    </>
  );
}
