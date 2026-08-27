<style>
  /* ===== MÉTRICAS EQUIPO ===== */
  .met-contenedor {
    display: flex !important;
    flex-direction: row !important;
    gap: 16px !important;
    width: 100% !important;
    box-sizing: border-box !important;
    align-items: stretch !important;
  }

  /* Una sola card: centrada, max 50% */
  .met-contenedor.solo {
    justify-content: center !important;
  }
  .met-contenedor.solo .met-card {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }

  /* Dos cards: mitad cada una */
  .met-contenedor.doble .met-card {
    flex: 1 1 0 !important;
    min-width: 0 !important;
  }

  /* Card base */
  .met-card {
    background: #ffffff !important;
    border: 1px solid #e4eaf2 !important;
    border-radius: 18px !important;
    padding: 22px 20px 18px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 0 !important;
    box-sizing: border-box !important;
    position: relative !important;
    overflow: hidden !important;
  }

  /* Ola decorativa inferior */
  .met-card::after {
    content: '' !important;
    position: absolute !important;
    bottom: 0 !important;
    left: -10% !important;
    width: 120% !important;
    height: 55px !important;
    border-radius: 50% 50% 0 0 !important;
    pointer-events: none !important;
    z-index: 0 !important;
  }
  .met-card.azul::after { background: rgba(24, 95, 165, 0.06) !important; }
  .met-card.verde::after { background: rgba(39, 103, 73, 0.06) !important; }

  /* Header: título + ícono */
  .met-header {
    width: 100% !important;
    display: flex !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    margin-bottom: 14px !important;
  }
  .met-titulo {
    font-size: 15px !important;
    font-weight: 700 !important;
    color: #1a202c !important;
    margin: 0 !important;
    line-height: 1.3 !important;
  }
  .met-icono-wrap {
    width: 44px !important;
    height: 44px !important;
    border-radius: 50% !important;
    background: #f4f7fb !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
  }
  .met-icono-wrap img {
    width: 24px !important;
    height: 24px !important;
    object-fit: contain !important;
  }

  /* Anillo SVG */
  .met-ring-wrap {
    position: relative !important;
    width: 160px !important;
    height: 160px !important;
    margin-bottom: 16px !important;
    flex-shrink: 0 !important;
  }
  .met-ring-wrap svg {
    width: 160px !important;
    height: 160px !important;
  }
  .met-ring-track {
    fill: none !important;
    stroke-width: 13 !important;
  }
  .met-ring-fill {
    fill: none !important;
    stroke-width: 13 !important;
    stroke-linecap: round !important;
    stroke-dasharray: 408 !important;
    stroke-dashoffset: 408 !important;
    transform: rotate(-90deg) !important;
    transform-origin: center !important;
    transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  .met-ring-fill.azul  { stroke: #2979d4 !important; }
  .met-ring-fill.verde { stroke: #27a06b !important; }
  .met-ring-track.azul  { stroke: #ddeaf8 !important; }
  .met-ring-track.verde { stroke: #d4ede3 !important; }

  /* Texto dentro del anillo (posicionado sobre el SVG) */
  .met-ring-label {
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    text-align: center !important;
    pointer-events: none !important;
    width: 120px !important;
  }
  .met-ring-pct {
    display: block !important;
    font-size: 28px !important;
    font-weight: 700 !important;
    line-height: 1.1 !important;
    margin-bottom: 2px !important;
  }
  .met-ring-pct.azul  { color: #2264b8 !important; }
  .met-ring-pct.verde { color: #1d8a5c !important; }
  .met-ring-ratio {
    display: block !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    color: #1a202c !important;
    margin-bottom: 2px !important;
  }
  .met-ring-sub {
    display: block !important;
    font-size: 11px !important;
    color: #718096 !important;
    line-height: 1.3 !important;
  }

  /* Footer: pendientes + descarga */
  .met-footer {
    width: 100% !important;
    border-top: 1px solid #edf2f7 !important;
    padding-top: 12px !important;
    margin-top: 4px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 8px !important;
    position: relative !important;
    z-index: 1 !important;
  }
  .met-pendiente-row {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }
  .met-pendiente-row img {
    width: 20px !important;
    height: 20px !important;
    object-fit: contain !important;
    flex-shrink: 0 !important;
    opacity: 0.55 !important;
  }
  .met-pendiente-txt {
    font-size: 13px !important;
    color: #4a5568 !important;
    line-height: 1.3 !important;
  }
  .met-pendiente-txt strong {
    display: block !important;
    font-weight: 600 !important;
    color: #2d3748 !important;
  }
  .met-link-descarga {
    display: flex !important;
    align-items: center !important;
    gap: 5px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    text-decoration: none !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
    padding: 6px 10px !important;
    border-radius: 8px !important;
    transition: background 0.15s !important;
  }
  .met-link-descarga.azul  { color: #2264b8 !important; }
  .met-link-descarga.verde { color: #1d8a5c !important; }
  .met-link-descarga:hover { background: #f4f7fb !important; }
  .met-link-descarga img {
    width: 15px !important;
    height: 15px !important;
    object-fit: contain !important;
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 374px) {
    .met-contenedor { flex-direction: column !important; }
    .met-contenedor.solo .met-card {
      flex: 1 1 100% !important;
      max-width: 100% !important;
    }
  }
  @media (min-width: 375px) and (max-width: 767px) {
    .met-contenedor { gap: 10px !important; }
    .met-contenedor.solo .met-card {
      flex: 1 1 100% !important;
      max-width: 100% !important;
    }
    .met-card { padding: 16px 14px 14px !important; }
    .met-ring-wrap { width: 130px !important; height: 130px !important; }
    .met-ring-wrap svg { width: 130px !important; height: 130px !important; }
    .met-ring-pct { font-size: 22px !important; }
    .met-ring-ratio { font-size: 12px !important; }
    .met-titulo { font-size: 13px !important; }
  }
  @media (min-width: 768px) and (max-width: 1023px) {
    .met-ring-wrap { width: 140px !important; height: 140px !important; }
    .met-ring-wrap svg { width: 140px !important; height: 140px !important; }
  }
</style>

<%
  /* Determinar color del anillo según porcentaje */
  String claseColorDir = (porcentajeDirecto >= 62) ? "azul" : (porcentajeDirecto >= 32) ? "azul" : "azul";
  /* El mockup siempre usa azul para directo y verde para indirecto, independiente del % */
%>

<div class="met-contenedor <% if(Integer.parseInt(zCantEvaluadosRepIndirectos) != 0){ %>doble<% }else{ %>solo<% } %>">

  <!-- ===== EQUIPO DIRECTO ===== -->
  <div class="met-card azul">
    <div class="met-header">
      <h3 class="met-titulo">Equipo directo</h3>
      <div class="met-icono-wrap">
        <img src="/mss_g3/espanol/performance/eval_lider/image/iconos/directo.webp" alt="directo">
      </div>
    </div>

    <div class="met-ring-wrap">
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <circle class="met-ring-track azul" cx="80" cy="80" r="65"/>
        <circle class="met-ring-fill azul" id="ringDir" cx="80" cy="80" r="65"/>
      </svg>
      <div class="met-ring-label">
        <span class="met-ring-pct azul"><%= porcentajeDirecto %>%</span>
        <span class="met-ring-ratio"><%=zCantObjConfDirectos%> de <%=zCantEvaluadosRepDirectos%></span>
        <span class="met-ring-sub">Evaluaciones<br>completadas</span>
      </div>
    </div>

    <div class="met-footer">
      <div class="met-pendiente-row">
        <img src="/mss_g3/espanol/performance/eval_lider/image/iconos/equipo_directo.webp" alt="">
        <div class="met-pendiente-txt">
          <strong><%=pendientesDir%> pendientes</strong>
          Evaluaciones por completar
        </div>
      </div>
      <%String zFecStart = com.meta4.taglib.util.M4PresentationUtilTaglib.secureEncrypt(request, "EncCorp76", zDtStart);%>
      <a class="met-link-descarga azul" href="javascript:verReporte2('directo');">
        <img src="/mss_g3/espanol/performance/eval_lider/image/iconos/descargar.png" alt="">
        Descargar informe
      </a>
    </div>
  </div>

  <!-- ===== EQUIPO INDIRECTO (condicional) ===== -->
  <% if(Integer.parseInt(zCantEvaluadosRepIndirectos) != 0){ %>
  <div class="met-card verde">
    <div class="met-header">
      <h3 class="met-titulo">Equipo completo</h3>
      <div class="met-icono-wrap">
        <img src="/mss_g3/espanol/performance/eval_lider/image/iconos/indirecto.webp" alt="indirecto">
      </div>
    </div>

    <div class="met-ring-wrap">
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <circle class="met-ring-track verde" cx="80" cy="80" r="65"/>
        <circle class="met-ring-fill verde" id="ringInd" cx="80" cy="80" r="65"/>
      </svg>
      <div class="met-ring-label">
        <span class="met-ring-pct verde"><%= porcentajeIndirectoStr %>%</span>
        <span class="met-ring-ratio"><%=zTotalObjConf%> de <%=zTotalEvaluados%></span>
        <span class="met-ring-sub">Evaluaciones<br>completadas</span>
      </div>
    </div>

    <div class="met-footer">
      <div class="met-pendiente-row">
        <img src="/mss_g3/espanol/performance/eval_lider/image/iconos/equipo_indirecto.webp" alt="">
        <div class="met-pendiente-txt">
          <strong><%=pendientesInd%> pendientes</strong>
          Evaluaciones por completar
        </div>
      </div>
      <a class="met-link-descarga verde" href="javascript:verReporte2('indirectos');">
        <img src="/mss_g3/espanol/performance/eval_lider/image/iconos/descargar.png" alt="">
        Descargar informe
      </a>
    </div>
  </div>
  <% } %>

</div>

<script>
(function() {
  var CIRCUM = 2 * Math.PI * 65; /* r=65 → ~408.4 */

  function animarAnillo(id, pct) {
    var el = document.getElementById(id);
    if (!el) return;
    var offset = CIRCUM * (1 - pct / 100);
    /* Forzar offset inicial en 0 (cerrado) y animar al valor real */
    el.style.strokeDasharray  = CIRCUM;
    el.style.strokeDashoffset = CIRCUM;
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        el.style.strokeDashoffset = offset;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    animarAnillo('ringDir', <%= porcentajeDirecto %>);
    animarAnillo('ringInd', <%= (int)porcentajeIndirecto %>);
  });
})();
</script>
