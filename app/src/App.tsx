import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Compass, GraduationCap, Search, Target, X } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CycleId = "all" | "DAM" | "DAW" | "ASIR" | "SMR";

type TopicBlock =
  | { type: "h"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; text: string }
  | { type: "callout"; title?: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "img"; src: string; alt: string; caption?: string };

type Topic = {
  id: string;
  title: string;
  body: string;
  pageBlocks?: TopicBlock[];
};

type Course = {
  id: string;
  title: string;
  cycles?: Exclude<CycleId, "all">[];
  cycle?: Exclude<CycleId, "all">;
  image?: string;
  inConstruction?: boolean;
  objectives?: string[];
  recommendations?: string[];
  topics?: Topic[];
};

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

const JUPYTER_IMG = "https://docs.chpc.wustl.edu/assets/jupyter-screenshot-2-y88n3Kk6.png";
const IDLE_IMG = "https://files.realpython.com/media/hello-world-idle.55208a57b4b6.png";

const CYCLES: { id: CycleId; name: string }[] = [
  { id: "all", name: "Todos" },
  { id: "DAM", name: "DAM" },
  { id: "DAW", name: "DAW" },
  { id: "ASIR", name: "ASIR" },
  { id: "SMR", name: "SMR" },
];

function cx() {
  return Array.prototype.slice
    .call(arguments)
    .filter(Boolean)
    .join(" ");
}

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

function getCycles(course: Course) {
  if (Array.isArray(course.cycles) && course.cycles.length) return course.cycles;
  if (course.cycle) return [course.cycle];
  return [] as Exclude<CycleId, "all">[];
}

function isInConstructionCourse(course: Course) {
  return course.inConstruction !== false;
}

function filterCourses(courses: Course[], query: string, cycle: CycleId) {
  const q = normalize(query).trim();
  return courses.filter((c) => {
    if (cycle !== "all") {
      const cycles = getCycles(c);
      if (cycles.indexOf(cycle as any) === -1) return false;
    }
    if (!q) return true;
    return normalize(c.title).includes(q);
  });
}

function sortCourses(list: Course[]) {
  const out = list.slice();
  out.sort((a, b) => {
    const ai = isInConstructionCourse(a) ? 1 : 0;
    const bi = isInConstructionCourse(b) ? 1 : 0;
    if (ai !== bi) return ai - bi;
    return (a.title || "").localeCompare(b.title || "", "es", { sensitivity: "base" });
  });
  return out;
}

function cycleAccent(cycle: string) {
  if (cycle === "DAM") return { a: "#6366F1", b: "#22C55E" };
  if (cycle === "DAW") return { a: "#0EA5E9", b: "#6366F1" };
  if (cycle === "ASIR") return { a: "#F59E0B", b: "#EF4444" };
  if (cycle === "SMR") return { a: "#10B981", b: "#0EA5E9" };
  return { a: "#64748B", b: "#94A3B8" };
}

function hashStr(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function courseImageDataUri(course: Course) {
  const primaryCycle = getCycles(course)[0] || "";
  const colors = cycleAccent(primaryCycle);
  const seed = hashStr(String(course.id || "") + "|" + String(course.title || "") + "|" + primaryCycle);

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
    "<filter id='b' x='-25%' y='-25%' width='150%' height='150%'>" +
    "<feGaussianBlur stdDeviation='34'/>" +
    "</filter>" +
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

const PYTHON_TOPICS: Topic[] = [
  {
    id: "t1",
    title: "1. Preparando el entorno",
    body: "Instalación, configuración del entorno y primer programa.",
    pageBlocks: [
      { type: "h", text: "Unidad 1 · Empezamos con Python" },
      {
        type: "p",
        text: "En esta unidad vas a entender qué es Python, por qué es tan popular y cómo preparar tu entorno para ejecutar tus primeros programas. La meta es que puedas abrir IDLE, crear un archivo `.py` y ejecutarlo con seguridad.",
      },
      { type: "h", text: "Objetivos de aprendizaje" },
      {
        type: "ul",
        items: [
          "Explicar con tus palabras qué significa “lenguaje interpretado”.",
          "Distinguir `IDE`, `editor` y `notebook`.",
          "Ejecutar un script con `F5` en `IDLE`.",
        ],
      },
      { type: "h", text: "Consejos del profe" },
      {
        type: "ul",
        items: [
          "Lee el ejemplo, predice el resultado y luego ejecútalo.",
          "Si algo falla, no “borres todo”: entiende el error y corrige paso a paso.",
          "Mejor 15–20 minutos al día que una sesión larga una vez a la semana.",
        ],
      },
      { type: "h", text: "1. ¿Qué es Python?" },
      {
        type: "p",
        text: "Python es un lenguaje de programación de alto nivel, interpretado, multiplataforma y open source. Es multiparadigma: puedes programar de forma imperativa, estructurada, orientada a objetos o funcional.",
      },
      { type: "h", text: "Características explicadas con ejemplos" },
      {
        type: "ul",
        items: [
          "Alto nivel: escribes código legible y directo.",
          "Interpretado: ejecutas directamente con el intérprete.",
          "Multiplataforma: el mismo `.py` funciona en distintos sistemas si hay intérprete instalado.",
          "Open source: comunidad enorme y librerías para casi todo.",
          "Multiparadigma: varios estilos para resolver problemas.",
        ],
      },
      { type: "code", text: "# Ejemplo rápido\nprint(\"Hola, Python\")\nprint(2 + 3)" },
      { type: "h", text: "El “Zen de Python” en 10 segundos" },
      {
        type: "p",
        text: "Tim Peters escribió una lista de principios que inspiran el diseño de Python. Puedes verla escribiendo `import this` en el intérprete.",
      },
      { type: "code", text: "# En el Shell (intérprete) de Python\nimport this" },
      {
        type: "p",
        text: "Cuando programes, usa esos principios como brújula: claridad, simplicidad y coherencia.",
      },
      { type: "h", text: "2. ¿Para qué sirve Python?" },
      {
        type: "p",
        text: "Python destaca porque no es solo un lenguaje: es un ecosistema. Tienes librerías y frameworks para muchos ámbitos.",
      },
      {
        type: "ul",
        items: [
          "Aplicaciones de escritorio (GUI).",
          "Desarrollo web (back-end).",
          "Bots y automatización.",
          "Datos (Data Science / Big Data).",
          "Educación.",
          "Videojuegos.",
          "Inteligencia Artificial.",
        ],
      },
      {
        type: "p",
        text: "Ejemplos rápidos (muy simples) para que veas el tipo de tareas que se hacen con Python:",
      },
      { type: "p", text: "Automatización: generar información y repetir tareas sin hacerlo a mano." },
      {
        type: "code",
        text: "from datetime import datetime\n\nusuario = \"Alex\"\nprint(\"Backup para\", usuario, \"->\", datetime.now())",
      },
      { type: "p", text: "Datos: calcular estadísticas rápidas (notas, medias, etc.)." },
      {
        type: "code",
        text: "notas = [6.5, 8, 7.5, 9]\nmedia = sum(notas) / len(notas)\nprint(\"Media:\", media)",
      },
      { type: "p", text: "Web: levantar un servidor básico con librerías incluidas en Python." },
      {
        type: "code",
        text:
          "import http.server\nimport socketserver\n\nPORT = 8000\nHandler = http.server.SimpleHTTPRequestHandler\n\nwith socketserver.TCPServer((\"\", PORT), Handler) as httpd:\n    print(\"Servidor en http://localhost:\", PORT)\n    httpd.serve_forever()",
      },
      { type: "h", text: "3. Entornos de desarrollo" },
      {
        type: "p",
        text: "Python se ejecuta con un intérprete. Para trabajar con comodidad usamos un entorno que permita escribir, guardar, ejecutar y leer errores con claridad.",
      },
      {
        type: "ul",
        items: [
          "IDE: todo en uno (PyCharm, Spyder).",
          "Editor: ligero y extensible (VS Code, Sublime Text).",
          "Notebook: por celdas (Jupyter).",
          "Distribuciones: paquetes listos (Anaconda).",
        ],
      },
      {
        type: "img",
        src: JUPYTER_IMG,
        alt: "Ejemplo de Jupyter Notebook",
        caption: "Ejemplo de un Notebook (Jupyter): ideal para ir probando código por celdas.",
      },
      { type: "h", text: "4. Primer contacto con IDLE" },
      {
        type: "p",
        text: "IDLE incluye dos piezas: `Shell` (intérprete) para pruebas rápidas y `Editor` para escribir programas completos en archivos `.py`.",
      },
      { type: "h", text: "4.1. Shell y Editor" },
      {
        type: "ul",
        items: [
          "Shell: escribes una línea y se ejecuta al momento.",
          "Editor: escribes un programa, lo guardas como `.py` y lo ejecutas.",
        ],
      },
      {
        type: "img",
        src: IDLE_IMG,
        alt: "IDLE Shell con un ejemplo",
        caption: "IDLE: Shell + Editor. Ideal para empezar y entender errores sin complicarte.",
      },
      { type: "h", text: "4.2. El color del texto te da pistas (léelo como un “semáforo”)" },
      {
        type: "p",
        text: "En IDLE, el coloreado ayuda a distinguir lo que es código, funciones, comentarios o errores. Si el programa dice “Naranja”, verás el texto en naranja.",
      },
      {
        type: "table",
        headers: ["Color (se muestra con su color)", "Qué suele significar"],
        rows: [
          ["Negro", "Datos y variables"],
          ["Naranja", "Comandos / palabras clave (por ejemplo `def`, `if`)"],
          ["Azul", "Definiciones (por ejemplo, el nombre de una función)"],
          ["Morado", "Funciones (por ejemplo `print()`)"],
          ["Rojo oscuro", "Comentarios"],
          ["Verde", "Cadenas de caracteres (strings)"],
          ["Rojo claro", "Errores"],
        ],
      },
      { type: "h", text: "5. Práctica guiada" },
      { type: "h", text: "Ejercicio 1 · Tu primer script" },
      { type: "p", text: "En el editor de IDLE, crea un archivo `u1_ej1.py` y escribe:" },
      { type: "code", text: "print(\"Hola, mundo\")\nprint(\"Hoy empiezo Python\")" },
      { type: "p", text: "Reto: cambia el texto para que muestre tu nombre y el grupo/clase." },
      { type: "h", text: "Ejercicio 2 · Variables sencillas" },
      { type: "code", text: "nombre = \"Alex\"\nedad = 18\nprint(\"Nombre:\", nombre)\nprint(\"Edad:\", edad)" },
      { type: "p", text: "Reto: crea una variable `curso` y muestra todo en una sola línea." },
      { type: "h", text: "Ejercicio 3 · Entender el intérprete" },
      { type: "p", text: "En el `Shell` (no en el editor), prueba:" },
      { type: "code", text: "print(2 + 3)\nprint(\"2\" + \"3\")" },
      { type: "p", text: "Pregunta: ¿por qué el resultado cambia? Escríbelo en tus palabras." },
      {
        type: "callout",
        title: "Checklist de unidad",
        text: "Si puedes crear un `.py`, ejecutarlo con `F5` en `IDLE` y explicar qué es un intérprete, has cumplido el objetivo.",
      },
    ],
  },
  { id: "t2", title: "2. Variables y tipos", body: "Números, strings, booleanos y conversiones." },
  { id: "t3", title: "3. Estructuras de control", body: "if/elif/else y buenas prácticas." },
  { id: "t4", title: "4. Bucles", body: "for, while, range, break/continue." },
  { id: "t5", title: "5. Funciones", body: "Parámetros, retorno, ámbito y docstrings." },
  { id: "t6", title: "6. Colecciones", body: "listas, tuplas, diccionarios y conjuntos." },
  { id: "t7", title: "7. Ficheros", body: "lectura/escritura y gestión de rutas." },
  { id: "t8", title: "8. Errores y excepciones", body: "try/except/finally y errores comunes." },
  { id: "t9", title: "9. Programación orientada a objetos", body: "clases, objetos, métodos y herencia básica." },
  { id: "t10", title: "10. Mini proyecto", body: "Un proyecto guiado para consolidar lo aprendido." },
];

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
  { id: "prog", title: "Programación", cycles: ["DAM", "DAW"] },
  { id: "dam-bbdd", title: "Bases de datos", cycle: "DAM" },
  { id: "dam-sist", title: "Sistemas informáticos", cycle: "DAM" },
  { id: "dam-entornos", title: "Entornos de desarrollo", cycle: "DAM" },
  { id: "lms", title: "Lenguajes de marcas y sistemas de gestión de información", cycles: ["DAM", "DAW", "ASIR"] },
  { id: "dam-acceso", title: "Acceso a datos", cycle: "DAM" },
  { id: "dam-pmdm", title: "Programación multimedia y dispositivos móviles", cycle: "DAM" },
  { id: "dam-psp", title: "Programación de servicios y procesos", cycle: "DAM" },
  { id: "dam-sge", title: "Sistemas de gestión empresarial", cycle: "DAM" },
  { id: "daw-bbdd", title: "Bases de datos", cycle: "DAW" },
  { id: "daw-sist", title: "Sistemas informáticos", cycle: "DAW" },
  { id: "daw-entornos", title: "Entornos de desarrollo", cycle: "DAW" },
  { id: "daw-despliegue", title: "Despliegue de aplicaciones web", cycle: "DAW" },
  { id: "daw-diseno", title: "Diseño de interfaces web", cycle: "DAW" },
  { id: "daw-cliente", title: "Desarrollo web en entorno cliente", cycle: "DAW" },
  { id: "daw-servidor", title: "Desarrollo web en entorno servidor", cycle: "DAW" },
  { id: "asir-implso", title: "Implantación de sistemas operativos", cycle: "ASIR" },
  { id: "asir-redes", title: "Planificación y administración de redes", cycle: "ASIR" },
  { id: "asir-fh", title: "Fundamentos de hardware", cycle: "ASIR" },
  { id: "asir-gestionbbdd", title: "Gestión de bases de datos", cycle: "ASIR" },
  { id: "asir-seg", title: "Seguridad y alta disponibilidad", cycle: "ASIR" },
  { id: "asir-servicios", title: "Servicios de red e Internet", cycle: "ASIR" },
  { id: "asir-sgi", title: "Administración de sistemas gestores de bases de datos", cycle: "ASIR" },
  { id: "smr-montaje", title: "Montaje y mantenimiento de equipos", cycle: "SMR" },
  { id: "smr-ofimatica", title: "Aplicaciones ofimáticas", cycle: "SMR" },
  { id: "smr-redeslocales", title: "Redes locales", cycle: "SMR" },
  { id: "smr-so", title: "Sistemas operativos monopuesto", cycle: "SMR" },
  { id: "smr-seg", title: "Seguridad informática", cycle: "SMR" },
  { id: "smr-sor", title: "Sistemas operativos en red", cycle: "SMR" },
  { id: "smr-servred", title: "Servicios en red", cycle: "SMR" },
];

function CyclePill(props: { item: { id: CycleId; name: string }; active: boolean; onClick: () => void }) {
  const item = props.item;
  const active = props.active;
  const onClick = props.onClick;

  return (
    <button
      onClick={onClick}
      className={cx(
        "group w-full flex h-10 sm:h-12 md:h-14 items-center justify-center rounded-2xl border bg-background/70 px-2 sm:px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:bg-background",
        active && "ring-2 ring-primary/40"
      )}
      type="button"
    >
      <span className="text-xs sm:text-sm font-semibold">{item.name}</span>
    </button>
  );
}

function CourseCard(props: { course: Course; onOpen?: (id: string) => void }) {
  const course = props.course;
  const cycles = getCycles(course);
  const imgSrc = course.image || courseImageDataUri(course);
  const inConstruction = isInConstructionCourse(course);
  const isPython = course.id === "python-intro";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.18 }}
      className={cx("h-full text-left", props.onOpen ? "cursor-pointer" : "cursor-default")}
      type="button"
      onClick={props.onOpen ? () => props.onOpen?.(course.id) : undefined}
      disabled={!props.onOpen}
    >
      <Card className="relative rounded-3xl border bg-background/70 shadow-sm h-full overflow-hidden">
        {inConstruction ? (
          <div className="absolute right-4 top-4 z-10 max-w-[92%] rounded-2xl bg-amber-500/95 px-4 py-2 text-sm md:text-base font-semibold tracking-wide text-white shadow-lg leading-snug">
            En construcción: estamos trabajando para que el curso esté completo en breve.
          </div>
        ) : null}

        <CardContent className="relative flex min-h-[11rem] flex-row items-stretch gap-4 p-4 sm:gap-5 sm:p-5">
          <div className="min-w-0 flex-1 relative pt-10 flex flex-col justify-center">
            <div className="absolute left-0 top-0 grid grid-cols-3 gap-2">
              {cycles.map((c) => (
                <span
                  key={c}
                  className="rounded-full border bg-background px-2.5 py-1 text-[11px] font-semibold tracking-wide text-center"
                >
                  {c}
                </span>
              ))}
            </div>

            <CardTitle className="font-semibold tracking-tight leading-tight whitespace-normal break-words hyphens-auto text-[clamp(1.35rem,1.9vw,2.35rem)]">
              {course.title}
            </CardTitle>
          </div>

          <div className="flex w-[44%] min-w-[120px] items-center justify-center">
            <div
              className={cx(
                "h-full w-full",
                isPython
                  ? "flex items-center justify-center rounded-3xl bg-background/30 p-3"
                  : "relative overflow-hidden rounded-3xl bg-background/30 shadow-sm ring-1 ring-black/5"
              )}
            >
              {isPython ? (
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                  <img
                    src={imgSrc}
                    alt="Logo del curso"
                    className="max-h-[120px] w-auto max-w-full sm:max-h-[140px] md:max-h-[160px] object-contain"
                    loading="lazy"
                  />
                </div>
              ) : (
                <img src={imgSrc} alt="Imagen del módulo" className="h-full w-full object-cover" loading="lazy" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.button>
  );
}

function TopicsFooter(props: { topics: Topic[]; active: string; onJump: (id: string) => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {props.topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => props.onJump(t.id)}
              className={cx(
                "whitespace-nowrap rounded-2xl border px-3 py-2 text-sm font-semibold shadow-sm transition",
                props.active === t.id ? "bg-background" : "bg-background/60 hover:bg-background"
              )}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopicBlocks(props: { blocks?: TopicBlock[] }) {
  const blocks = props.blocks;
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  const RichText = (p: { text: string; className?: string }) => {
    const raw = String(p.text || "");
    const parts = raw.split(/`([^`]+)`/g);
    return (
      <span className={p.className}>
        {parts.map((seg, i) =>
          i % 2 === 1 ? (
            <code
              key={"c-" + i}
              className="mx-0.5 inline-flex items-center rounded-xl border bg-background/70 px-2 py-0.5 font-mono text-[0.95em]"
            >
              {seg}
            </code>
          ) : (
            <span key={"t-" + i}>{seg}</span>
          )
        )}
      </span>
    );
  };

  const PY_KEYWORDS = new Set([
    "as",
    "assert",
    "break",
    "class",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "False",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "None",
    "nonlocal",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "True",
    "try",
    "while",
    "with",
    "yield",
  ]);

  const PY_BUILTINS = new Set([
    "print",
    "len",
    "range",
    "int",
    "float",
    "str",
    "list",
    "dict",
    "set",
    "tuple",
    "input",
    "type",
    "help",
    "sum",
  ]);

  const tokenizePythonLine = (line: string) => {
    let inSingle = false;
    let inDouble = false;
    let escaped = false;
    let commentAt = -1;

    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (!inDouble && ch === "'") inSingle = !inSingle;
      else if (!inSingle && ch === '"') inDouble = !inDouble;
      else if (!inSingle && !inDouble && ch === "#") {
        commentAt = i;
        break;
      }
    }

    const codePart = commentAt === -1 ? line : line.slice(0, commentAt);
    const commentPart = commentAt === -1 ? "" : line.slice(commentAt);

    const tokens = Array.from(
      codePart.matchAll(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|\b[A-Za-z_]\w*\b|\b\d+(?:\.\d+)?\b|\s+|.)/g)
    ).map((m) => m[0]);

    const rendered = tokens.map((t, idx) => {
      if (!t) return null;
      if (t.trim().length === 0) return <span key={"ws-" + idx}>{t}</span>;
      const isString = t.startsWith("\"") || t.startsWith("'");
      if (isString)
        return (
          <span key={"s-" + idx} className="text-emerald-300">
            {t}
          </span>
        );
      if (/^\d/.test(t))
        return (
          <span key={"n-" + idx} className="text-amber-300">
            {t}
          </span>
        );
      if (PY_KEYWORDS.has(t))
        return (
          <span key={"k-" + idx} className="text-orange-300">
            {t}
          </span>
        );
      if (PY_BUILTINS.has(t))
        return (
          <span key={"b-" + idx} className="text-violet-300">
            {t}
          </span>
        );
      return <span key={"t-" + idx}>{t}</span>;
    });

    if (commentPart)
      rendered.push(
        <span key="c" className="text-rose-300">
          {commentPart}
        </span>
      );

    return rendered;
  };

  const CodeBlock = (p: { text: string }) => {
    const cleaned = String(p.text || "").split(String.fromCharCode(13)).join("");
    const lines = cleaned.split(String.fromCharCode(10));
    return (
      <pre className="overflow-x-auto rounded-3xl bg-slate-950/95 p-5 sm:p-6 text-sm sm:text-base shadow-sm ring-1 ring-black/10">
        <code className="whitespace-pre text-slate-100">
          {lines.map((ln, idx) => (
            <span key={"l-" + idx}>
              {tokenizePythonLine(ln)}
              {idx < lines.length - 1 ? String.fromCharCode(10) : ""}
            </span>
          ))}
        </code>
      </pre>
    );
  };

  const ColorName = (name: string) => {
    const n = normalize(name);
    if (n === "negro") return "text-slate-900";
    if (n === "naranja") return "text-orange-500";
    if (n === "azul") return "text-blue-500";
    if (n === "morado") return "text-violet-600";
    if (n === "rojo oscuro") return "text-red-800";
    if (n === "rojo claro") return "text-red-500";
    if (n === "verde") return "text-emerald-600";
    return "text-slate-900";
  };

  const isSubHeading = (t: string) => {
    const s = String(t || "").trim();
    const d1 = s.indexOf(".");
    if (d1 <= 0) return false;
    const d2 = s.indexOf(".", d1 + 1);
    if (d2 <= d1 + 1) return false;
    const a = s.slice(0, d1);
    const b = s.slice(d1 + 1, d2);
    if (!a || !b) return false;
    for (let i = 0; i < a.length; i += 1) {
      const ch = a[i];
      if (ch < "0" || ch > "9") return false;
    }
    for (let i = 0; i < b.length; i += 1) {
      const ch = b[i];
      if (ch < "0" || ch > "9") return false;
    }
    return true;
  };

  const isExerciseHeading = (t: string) => {
    const s = String(t || "").trim().toLowerCase();
    if (!s.startsWith("ejercicio")) return false;
    const rest = s.slice("ejercicio".length).trim();
    return !!rest && rest[0] >= "0" && rest[0] <= "9";
  };

  const sections: { title: string; blocks: TopicBlock[] }[] = [];
  let current: { title: string; blocks: TopicBlock[] } | null = null;

  blocks.forEach((b) => {
    if (!b) return;
    if (b.type === "h") {
      const t = String(b.text || "").trim();
      if (isSubHeading(t) || isExerciseHeading(t)) {
        if (!current) {
          current = { title: "", blocks: [] };
          sections.push(current);
        }
        current.blocks.push(b);
        return;
      }
      current = { title: b.text, blocks: [] };
      sections.push(current);
      return;
    }
    if (!current) {
      current = { title: "", blocks: [] };
      sections.push(current);
    }
    current.blocks.push(b);
  });

  const renderBlock = (b: TopicBlock, idx: number) => {
    if (!b) return null;

    if (b.type === "h") {
      return (
        <div key={"sh-" + idx} className="text-base sm:text-lg font-semibold tracking-tight leading-tight">
          {b.text}
        </div>
      );
    }

    if (b.type === "p") {
      return (
        <div key={"p-" + idx} className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          <RichText text={b.text} />
        </div>
      );
    }

    if (b.type === "ul") {
      return (
        <ul key={"ul-" + idx} className="space-y-2 text-sm sm:text-base text-muted-foreground">
          {b.items.map((it, j) => (
            <li key={"it-" + idx + "-" + j} className="list-disc ml-6">
              <RichText text={it} />
            </li>
          ))}
        </ul>
      );
    }

    if (b.type === "ol") {
      return (
        <ol key={"ol-" + idx} className="space-y-2 text-sm sm:text-base text-muted-foreground">
          {b.items.map((it, j) => (
            <li key={"oit-" + idx + "-" + j} className="list-decimal ml-6">
              <RichText text={it} />
            </li>
          ))}
        </ol>
      );
    }

    if (b.type === "code") return <CodeBlock key={"code-" + idx} text={b.text} />;

    if (b.type === "callout") {
      return (
        <div key={"callout-" + idx} className="rounded-3xl border bg-background/60 p-5 shadow-sm">
          {b.title ? <div className="text-base font-semibold tracking-tight">{b.title}</div> : null}
          <div
            className={cx(
              "text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line",
              b.title ? "mt-2" : ""
            )}
          >
            <RichText text={b.text} />
          </div>
        </div>
      );
    }

    if (b.type === "table") {
      const isColorTable = b.headers.length > 0 && normalize(b.headers[0]).includes("color");
      return (
        <div key={"table-" + idx} className="overflow-x-auto rounded-3xl border bg-background/60">
          <table className="min-w-[680px] w-full text-sm sm:text-base">
            <thead>
              <tr className="border-b bg-background/70">
                {b.headers.map((h, i) => (
                  <th key={"th-" + idx + "-" + i} className="px-5 py-4 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={"tr-" + idx + "-" + r} className="border-b last:border-b-0">
                  {row.map((cell, c) => {
                    if (isColorTable && c === 0) {
                      return (
                        <td key={"td-" + idx + "-" + r + "-" + c} className="px-5 py-4 align-top font-semibold">
                          <span className={ColorName(cell)}>{cell}</span>
                        </td>
                      );
                    }
                    return (
                      <td key={"td-" + idx + "-" + r + "-" + c} className="px-5 py-4 align-top text-muted-foreground">
                        <RichText text={cell} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (b.type === "img") {
      return (
        <figure key={"img-" + idx} className="overflow-hidden rounded-3xl bg-background/60 shadow-sm">
          <img
            src={b.src}
            alt={b.alt}
            className="w-full max-h-[440px] object-contain bg-background"
            loading="lazy"
          />
          {b.caption ? <figcaption className="px-4 py-3 text-sm text-muted-foreground">{b.caption}</figcaption> : null}
        </figure>
      );
    }

    return null;
  };

  return (
    <div className="space-y-5">
      {sections.map((sec, i) => (
        <Card key={"sec-" + i} className="rounded-3xl border bg-background/70 shadow-sm">
          <CardContent className="p-5">
            {sec.title ? (
              <div className="text-[clamp(1.1rem,1.7vw,1.65rem)] font-semibold tracking-tight leading-tight">
                {sec.title}
              </div>
            ) : null}
            <div className={cx("space-y-5", sec.title ? "mt-4" : "")}>
              {sec.blocks.map((b, idx) => renderBlock(b, i * 1000 + idx))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CourseHome(props: {
  course: Course;
  onBack: () => void;
  onOpenTopic: (topicId: string) => void;
  activeTopic: string;
  onJumpToIndex: (topicId: string) => void;
  indexRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) {
  const course = props.course;
  const topics = course.topics || [];
  const imgSrc = course.image || courseImageDataUri(course);

  return (
    <div className="min-h-screen pb-24 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.10),transparent_60%)]">
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 text-[clamp(1.4rem,2.6vw,2.8rem)] font-semibold tracking-tight leading-tight whitespace-normal break-words">
              {course.title}
            </div>
            <Button onClick={props.onBack} className="h-11 rounded-2xl" variant="secondary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-6 sm:py-8">
        <div className="grid gap-6 md:grid-cols-12 md:items-stretch">
          <div className="md:col-span-6 md:h-full">
            <Card className="rounded-3xl border bg-background/70 shadow-sm md:h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4" />
                  Objetivos
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(course.objectives || []).map((o) => (
                    <li key={o} className="list-disc ml-5">
                      {o}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-6 flex items-center justify-center md:h-full">
            <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-background/30 p-4 shadow-sm md:h-full">
              <img src={imgSrc} alt="Imagen del curso" className="max-h-[320px] w-auto max-w-full object-contain" />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Card className="rounded-3xl border bg-background/70 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Compass className="h-4 w-4" />
                Recomendación
              </div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {(course.recommendations || []).map((r) => (
                  <li key={r} className="list-disc ml-5">
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Índice de temas</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {topics.map((t) => (
              <button key={t.id} type="button" onClick={() => props.onOpenTopic(t.id)} className="text-left">
                <Card className="rounded-3xl border bg-background/70 shadow-sm">
                  <CardContent
                    ref={(el) => {
                      props.indexRefs.current[t.id] = el;
                    }}
                    className="p-5"
                    id={t.id}
                  >
                    <div className="text-sm font-semibold">{t.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{t.body}</div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </main>

      <TopicsFooter topics={topics} active={props.activeTopic} onJump={props.onJumpToIndex} />
    </div>
  );
}

function TopicPage(props: {
  course: Course;
  topic: Topic;
  onBackToCourse: () => void;
  onSelectTopic: (topicId: string) => void;
}) {
  const topics = props.course.topics || [];

  return (
    <div className="min-h-screen pb-24 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.10),transparent_60%)]">
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 text-[clamp(1.2rem,2.2vw,2.2rem)] font-semibold tracking-tight leading-tight whitespace-normal break-words">
              {props.topic.title}
            </div>
            <Button onClick={props.onBackToCourse} className="h-11 rounded-2xl" variant="secondary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8">
        {props.topic.pageBlocks ? (
          <TopicBlocks blocks={props.topic.pageBlocks} />
        ) : (
          <Card className="rounded-3xl border bg-background/70 shadow-sm">
            <CardContent className="p-5">
              <div className="text-sm font-semibold">En construcción</div>
              <div className="mt-2 text-sm text-muted-foreground">Estamos trabajando para que el tema esté completo en breve.</div>
            </CardContent>
          </Card>
        )}
      </main>

      <TopicsFooter topics={topics} active={props.topic.id} onJump={props.onSelectTopic} />
    </div>
  );
}

function assertEq(name: string, a: any, b: any) {
  return { name, pass: Object.is(a, b) };
}

const SELF_TESTS: Array<() => Array<{ name: string; pass: boolean }>> = [
  () => {
    const list: Course[] = [
      { id: "a", title: "Zeta", inConstruction: true },
      { id: "b", title: "Alfa", inConstructi