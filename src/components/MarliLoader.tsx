import { useId } from 'react';

// Loader de marca: un libro abierto cuya página se despega, se flexiona como
// papel real (interpolando el atributo `d` del SVG vía CSS, no un scaleX
// fingiendo compresión) y se asienta del otro lado con un pequeño rebote
// físico. Ver la animación completa (comentada a fondo) en globals.css.
//
// useId() namespacea los <defs> para poder montar varias instancias a la vez
// (p. ej. el loading.tsx de una ruta + un spinner inline en la misma pantalla)
// sin que sus ids colisionen.
export function MarliLoader({ size = 96, label }: { size?: number | string; label?: string }) {
  const uid = useId().replace(/:/g, '');
  const leaf = `marliLeaf-${uid}`;
  const spark = `marliSpark-${uid}`;
  const pageFront = `marliPageFront-${uid}`;
  const pageBack = `marliPageBack-${uid}`;
  const edgeGrad = `marliEdge-${uid}`;
  const spineGrad = `marliSpine-${uid}`;
  const gutterR = `marliGutterR-${uid}`;
  const gutterL = `marliGutterL-${uid}`;
  const ambient = `marliAmbient-${uid}`;

  return (
    <div
      className="marli-loader"
      role="img"
      aria-label={label ?? 'Cargando'}
      style={{ width: size, aspectRatio: '320 / 224' }}
    >
      <svg viewBox="0 0 320 224" preserveAspectRatio="xMidYMid meet" shapeRendering="geometricPrecision">
        <defs>
          {/* Forma base: nunca se pinta sola, solo alimenta los <use> de abajo */}
          <path id={leaf} className="leaf-base-d" d="M160,48 L256,46 C256,70 256,97 256,112 C256,127 256,154 256,178 L160,176 Z" />
          <path id={spark} d="M0,-7 C1.2,-1.2 1.2,-1.2 7,0 C1.2,1.2 1.2,1.2 0,7 C-1.2,1.2 -1.2,1.2 -7,0 C-1.2,-1.2 -1.2,-1.2 0,-7 Z" />

          <linearGradient id={pageFront} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fbfaf7" />
            <stop offset="100%" stopColor="#f1efe9" />
          </linearGradient>

          <linearGradient id={pageBack} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f2efe6" />
            <stop offset="55%" stopColor="#eae5d8" />
            <stop offset="100%" stopColor="#e3ddcc" />
          </linearGradient>

          <linearGradient id={edgeGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#345457" stopOpacity=".45" />
            <stop offset="100%" stopColor="#C8A86B" stopOpacity=".55" />
          </linearGradient>

          <linearGradient id={spineGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#eef2f1" />
            <stop offset="45%" stopColor="#c9d3d2" />
            <stop offset="55%" stopColor="#c9d3d2" />
            <stop offset="100%" stopColor="#eef2f1" />
          </linearGradient>

          <linearGradient id={gutterR} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#14262a" stopOpacity=".28" />
            <stop offset="100%" stopColor="#14262a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={gutterL} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#14262a" stopOpacity=".28" />
            <stop offset="100%" stopColor="#14262a" stopOpacity="0" />
          </linearGradient>

          <radialGradient id={ambient} cx="50%" cy="20%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse className="ambient-light" cx="160" cy="30" rx="150" ry="60" fill={`url(#${ambient})`} />
        <ellipse className="ground-shadow" cx="160" cy="199" rx="120" ry="9" />

        {/* Pila estática izquierda (5 hojas en abanico) */}
        <path className="stack-sheet" fill="#e0dccc" stroke="rgba(30,49,52,.16)" d="M160,52 L76,50 C76,73 89,96 110,112 C89,129 76,151 76,174 L160,172 Z" />
        <path className="stack-sheet" fill="#e8e4d7" stroke="rgba(30,49,52,.19)" d="M160,51 L73,49 C73,72 82,96 96,112 C82,128 73,152 73,175 L160,173 Z" />
        <path className="stack-sheet" fill="#efece2" stroke="rgba(30,49,52,.22)" d="M160,50 L70,48 C70,71 76,96 84,112 C76,128 70,153 70,176 L160,174 Z" />
        <path className="stack-sheet" fill="#f7f5ef" stroke="rgba(30,49,52,.26)" d="M160,49 L67,47 C67,70 70,96 74,112 C70,128 67,154 67,177 L160,175 Z" />
        <path className="stack-sheet" fill="#ffffff" stroke="rgba(30,49,52,.3)" d="M160,48 L64,46 C64,70 64,97 64,112 C64,127 64,154 64,178 L160,176 Z" />
        <path fill="none" stroke="rgba(30,49,52,.16)" strokeWidth={0.8} opacity={0.7} d="M78,60 Q66,112 78,164" />

        {/* Pila estática derecha (idéntica en espejo) */}
        <path className="stack-sheet" fill="#e0dccc" stroke="rgba(30,49,52,.16)" d="M160,52 L244,50 C244,73 231,96 210,112 C231,129 244,151 244,174 L160,172 Z" />
        <path className="stack-sheet" fill="#e8e4d7" stroke="rgba(30,49,52,.19)" d="M160,51 L247,49 C247,72 238,96 224,112 C238,128 247,152 247,175 L160,173 Z" />
        <path className="stack-sheet" fill="#efece2" stroke="rgba(30,49,52,.22)" d="M160,50 L250,48 C250,71 244,96 236,112 C244,128 250,153 250,176 L160,174 Z" />
        <path className="stack-sheet" fill="#f7f5ef" stroke="rgba(30,49,52,.26)" d="M160,49 L253,47 C253,70 250,96 246,112 C250,128 253,154 253,177 L160,175 Z" />
        <path className="stack-sheet" fill="#ffffff" stroke="rgba(30,49,52,.3)" d="M160,48 L256,46 C256,70 256,97 256,112 C256,127 256,154 256,178 L160,176 Z" />
        <path fill="none" stroke="rgba(30,49,52,.16)" strokeWidth={0.8} opacity={0.7} d="M242,60 Q254,112 242,164" />

        {/* Sombra de la unión (gutter) sobre ambas pilas, antes del lomo */}
        <rect className="gutter-shadow" x="120" y="46" width="32" height="132" fill={`url(#${gutterL})`} />
        <rect className="gutter-shadow" x="168" y="46" width="32" height="132" fill={`url(#${gutterR})`} />

        {/* Lomo */}
        <path className="spine" fill={`url(#${spineGrad})`} d="M151,48 Q151,43 156,43 L164,43 Q169,43 169,48 L169,176 Q169,181 164,181 L156,181 Q151,181 151,176 Z" />
        <line className="spine-ridge" x1="155" y1="70" x2="165" y2="70" />
        <line className="spine-ridge" x1="155" y1="112" x2="165" y2="112" />
        <line className="spine-ridge" x1="155" y1="154" x2="165" y2="154" />

        {/* La hoja que gira: sombra proyectada → filo de papel → dorso → frente.
            Los "hint" son líneas finísimas sugiriendo texto impreso, agrupadas
            con su cara para que giren pegadas a ella. */}
        <use className="leaf-shadow" href={`#${leaf}`} />

        <g className="leaf-edge-wrap">
          <use className="leaf-edge" href={`#${leaf}`} />
        </g>

        <g className="leaf-verso-group">
          <use className="leaf-verso-shape" href={`#${leaf}`} fill={`url(#${pageBack})`} />
          <path className="leaf-hint" fill="none" opacity={0.5} d="M170,64 L232,62" />
          <path className="leaf-hint" fill="none" opacity={0.4} d="M170,74 L224,72" />
          <path className="leaf-hint" fill="none" opacity={0.4} d="M170,84 L228,82" />
        </g>

        <g className="leaf-recto-group">
          <use className="leaf-recto-shape" href={`#${leaf}`} fill={`url(#${pageFront})`} stroke={`url(#${edgeGrad})`} />
          <path className="leaf-hint" fill="none" opacity={0.45} d="M172,62 L234,60" />
          <path className="leaf-hint" fill="none" opacity={0.35} d="M172,72 L226,70" />
          <path className="leaf-hint" fill="none" opacity={0.35} d="M172,82 L230,80" />
        </g>

        <use className="spark spark-1" href={`#${spark}`} x="150" y="20" />
        <use className="spark spark-2" href={`#${spark}`} x="180" y="14" />
        <use className="spark spark-3" href={`#${spark}`} x="204" y="26" />
        <use className="spark spark-4" href={`#${spark}`} x="128" y="30" />
        <use className="spark spark-5" href={`#${spark}`} x="168" y="34" />
        <use className="spark spark-6" href={`#${spark}`} x="192" y="42" />
      </svg>
    </div>
  );
}

// Pantalla completa para usar como `loading.tsx` de una ruta, o como estado de
// carga de una sección que ocupa toda la vista (checkout procesando, etc).
export function PageLoader({ label = 'Cargando tu próxima historia…', background = '#F7F9F8' }: { label?: string; background?: string }) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '18px',
        background,
      }}
    >
      <MarliLoader size={130} />
      <p className="text-[13px] tracking-wide" style={{ color: '#7A8C8A', fontFamily: 'var(--font-playfair)', fontStyle: 'italic' }}>
        {label}
      </p>
    </div>
  );
}
