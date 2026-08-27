<%@ taglib uri="M4Tags" prefix="m4"%>
<%@ page import="java.io.*, java.util.*, java.net.*, java.lang.Math"%>
<%@ page import="com.meta4.m4operations.*"%>
<%@ page import="com.meta4.session.*, com.meta4.m4operations.*,com.meta4.utilities.*" %>

<!DOCTYPE html>
<html lang="en">

<script type="text/javascript">
  function verReporteDepend(dtStartEval,tipRep){}
  function verReporte(dFechaProc, incluir_mesas){
    urlRedirecc = "/servlet/CheckSecurity/JSP/mss_g3/mss_g3_p16_reporte.jsp?idproces=0155&dFechaProc="+dFechaProc+"&incluirMesas="+incluir_mesas;
    window.open(urlRedirecc, '_blank');
  }
  function verReporteCompleto(dFechaProc){
    urlRedirecc = "/servlet/CheckSecurity/JSP/mss_g3/mss_g3_p16_reporte.jsp?idproces=0155&repCompleto=S&dFechaProc="+dFechaProc;
    window.open(urlRedirecc, '_blank');
  }
</script>

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Organigrama - Perfil</title>
  <%
    M4SessionCl zsesion12 = M4Context.getM4SessionCl(request);
    String usuarioActivo = zsesion12.getBagEntries("zIdPerson");
  %>
  <link rel="stylesheet" href="/mss_g3/espanol/performance/feed_seg_lider/css/styleSeg.css?v=3">
  <script src="/responsive/bootstrap/bootstrap.js?v=0"></script>
  <script src="/responsive/js/Chart.min.js"></script>

<%
  String ztarea         = "SSCAR_METRICAS_ED";
  String zsubsesion     = "SSCAR_METRICAS_ED";
  String zMeta4Object   = "SSCAR_METRICAS_ED";
  String znodo          = "SSCAR_METRICAS_ED";
  String zNodoSeg       = "SSCAR_METRICAS_FEED_SEG";
  String zsubsesionTask = "SSCAR_METRICAS_ED";
  String znodoEvaluator = "SSCAR_MET_EVALUATOR";
  String zraizEval      = znodoEvaluator + ":" + zsubsesion + "!" + znodoEvaluator + ".";
  String zDtStartEval   = zraizEval + "P_START_EVAL";
%>
<%
  String zoutputdef      = ztarea + "!" + znodo + "[*]";
  String zmove           = znodo + ":" + znodo + "[FIRST]";
  String zraiz           = znodo + ":" + ztarea + "!" + znodo + ".";
  String zcomun          = znodo + ":" + ztarea + "!" + znodo + "[&VAR.m4lix]" + ".";
  String zoutputdefSeteo = ztarea + "!" + zNodoSeg + "[*]";
  String zmoveSeteo      = zNodoSeg + ":" + zNodoSeg + "[FIRST]";
  String zraizSeteo      = zNodoSeg + ":" + ztarea + "!" + zNodoSeg + ".";
  String zcomunSeteo     = zNodoSeg + ":" + ztarea + "!" + zNodoSeg + "[&VAR.m4lix]" + ".";
  String zMETODOCARGA    = "CAR_M_CALCULAR_METRICAS:" + ztarea + "!" + zNodoSeg + ".CAR_M_CALCULAR_METRICAS";
  String zoutputdefEval  = ztarea + "!" + znodoEvaluator + "[*]";
%>
</head>

<body>

  <m4:startpage m4task="<%=zsubsesionTask%>"/>
    <m4:beginjob/>
    <m4:datadef m4o="<%=zMeta4Object%>" m4name="<%=zsubsesion%>"/>
    <m4:exec m4method="<%=zMETODOCARGA%>">
      <m4:param name="ARG_ID_HR" value="<%=usuarioActivo%>"/>
    </m4:exec>
    <m4:outputdef m4alias="<%=znodo%>">        <m4:param name="m4name0" value="<%=zoutputdef%>"/>       </m4:outputdef>
    <m4:outputdef m4alias="<%=znodoEvaluator%>"><m4:param name="m4name0" value="<%=zoutputdefEval%>"/>  </m4:outputdef>
    <m4:outputdef m4alias="<%=zNodoSeg%>">      <m4:param name="m4name0" value="<%=zoutputdefSeteo%>"/> </m4:outputdef>
  <m4:endjob/>

  <%
    String zCantEvaluadosRepDirectos   = "";
    String zCantEvaluadosRepIndirectos = "";
    String zCantObjConfDirectos        = "";
    String zCantObjConfIndirectos      = "";
    String zCantHeadsDirectos          = "";
    String zCantHeadsIndirectos        = "";
    Integer zTotalEvaluados = 0;
    Integer zTotalObjConf   = 0;

    try {
      M4Operations m = new M4Operations(request);
      zCantEvaluadosRepDirectos   = m.getItem(zNodoSeg, zMeta4Object, zNodoSeg, "", "P_CANT_REG_DIR");
      zCantEvaluadosRepIndirectos = m.getItem(zNodoSeg, zMeta4Object, zNodoSeg, "", "P_CANT_REG_IND");
      zCantObjConfDirectos        = m.getItem(zNodoSeg, zMeta4Object, zNodoSeg, "", "P_CANT_OBJ_CONF_DIR");
      zCantObjConfIndirectos      = m.getItem(zNodoSeg, zMeta4Object, zNodoSeg, "", "P_CANT_OBJ_CONF_IND");
      zCantHeadsDirectos          = m.getItem(zNodoSeg, zMeta4Object, zNodoSeg, "", "P_CANT_HEAD_DIR");
      zCantHeadsIndirectos        = m.getItem(zNodoSeg, zMeta4Object, zNodoSeg, "", "P_CANT_HEAD_IND");

      zCantEvaluadosRepDirectos   = zCantEvaluadosRepDirectos.split("\\.")[0];
      zCantEvaluadosRepIndirectos = zCantEvaluadosRepIndirectos.split("\\.")[0];
      zCantObjConfDirectos        = zCantObjConfDirectos.split("\\.")[0];
      zCantObjConfIndirectos      = zCantObjConfIndirectos.split("\\.")[0];
      zCantHeadsDirectos          = zCantHeadsDirectos.split("\\.")[0];
      zCantHeadsIndirectos        = zCantHeadsIndirectos.split("\\.")[0];

      zTotalEvaluados = Integer.parseInt(zCantEvaluadosRepDirectos) + Integer.parseInt(zCantEvaluadosRepIndirectos);
      zTotalObjConf   = Integer.parseInt(zCantObjConfDirectos) + Integer.parseInt(zCantObjConfIndirectos);
    } catch(Exception e) {}
  %>

  <%
    int sCountiSSCAR_METRICAS_ED = 0;
    try {
      M4Operations m = new M4Operations(request);
      sCountiSSCAR_METRICAS_ED = m.getCountInClient(znodo, zsubsesion, znodo);
    } catch(Exception e) { out.print(e); }
  %>

  <%
    /* ---- igual que el original ---- */
    Integer porcentajeDirecto = 0;
    if (Integer.parseInt(zCantEvaluadosRepDirectos) != 0) {
      porcentajeDirecto = (Integer.parseInt(zCantObjConfDirectos) * 100) / Integer.parseInt(zCantEvaluadosRepDirectos);
    }
    Integer pendientesDir = Integer.parseInt(zCantEvaluadosRepDirectos) - Integer.parseInt(zCantObjConfDirectos);

    double porcentajeIndirecto = 0.0;
    int    pendientesInd       = 0;
    int    porcentajeAvanceTotal = 100;

    /* FIX: el original solo calculaba si zCantObjConfIndirectos != 0,
       pero el equipo completo incluye directos + indirectos, así que
       alcanza con que haya evaluados totales */
    if (zTotalEvaluados > 0) {
      porcentajeIndirecto = (zTotalObjConf * 100.0) / zTotalEvaluados;
      pendientesInd       = zTotalEvaluados - zTotalObjConf;
    }
    String porcentajeIndirectoStr = String.format("%.0f", porcentajeIndirecto);

    /* ---- circumferencia del anillo: r=65 → 2*PI*65 = 408.41 ---- */
    double CIRCUM = 2 * Math.PI * 65;
    /* dashoffset inicial = CIRCUM (cerrado), final = CIRCUM * (1 - pct/100) */
    double offsetDir = CIRCUM * (1.0 - porcentajeDirecto / 100.0);
    double offsetInd = CIRCUM * (1.0 - porcentajeIndirecto / 100.0);

    /* Formatear para el atributo SVG */
    String circumStr  = String.format("%.2f", CIRCUM);
    String offsetDirStr = String.format("%.2f", offsetDir);
    String offsetIndStr = String.format("%.2f", offsetInd);
  %>

  <m4:item m4varname="zDtStart" m4name="<%=zDtStartEval%>"/>

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
    .met-contenedor.solo { justify-content: center !important; }
    .met-contenedor.solo .met-card { flex: 0 0 50% !important; max-width: 50% !important; }
    .met-contenedor.doble .met-card { flex: 1 1 0 !important; min-width: 0 !important; }

    .met-card {
      background: #ffffff !important;
      border: 1px solid #e4eaf2 !important;
      border-radius: 18px !important;
      padding: 22px 20px 18px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      box-sizing: border-box !important;
      position: relative !important;
      overflow: hidden !important;
    }
    .met-card::after {
      content: '' !important;
      position: absolute !important;
      bottom: 0 !important; left: -10% !important;
      width: 120% !important; height: 55px !important;
      border-radius: 50% 50% 0 0 !important;
      pointer-events: none !important; z-index: 0 !important;
    }
    .met-card.azul::after  { background: rgba(24,95,165,0.06) !important; }
    .met-card.verde::after { background: rgba(39,103,73,0.06) !important; }

    .met-header {
      width: 100% !important;
      display: flex !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      margin-bottom: 14px !important;
    }
    .met-titulo {
      font-size: 15px !important; font-weight: 700 !important;
      color: #1a202c !important; margin: 0 !important; line-height: 1.3 !important;
    }
    .met-icono-wrap {
      width: 44px !important; height: 44px !important;
      border-radius: 50% !important; background: #f4f7fb !important;
      display: flex !important; align-items: center !important;
      justify-content: center !important; flex-shrink: 0 !important;
    }
    .met-icono-wrap img { width: 24px !important; height: 24px !important; object-fit: contain !important; }

    .met-ring-wrap {
      position: relative !important;
      width: 160px !important; height: 160px !important;
      margin-bottom: 16px !important; flex-shrink: 0 !important;
    }
    .met-ring-wrap svg { width: 160px !important; height: 160px !important; }

    .met-ring-track { fill: none !important; stroke-width: 13 !important; }
    .met-ring-track.azul  { stroke: #ddeaf8 !important; }
    .met-ring-track.verde { stroke: #d4ede3 !important; }

    .met-ring-fill {
      fill: none !important;
      stroke-width: 13 !important;
      stroke-linecap: round !important;
      stroke-dasharray: 408.41 !important;
      stroke-dashoffset: 408.41 !important;
    }
    .met-ring-fill.azul  { stroke: #2979d4 !important; }
    .met-ring-fill.verde { stroke: #27a06b !important; }

    .met-ring-label {
      position: absolute !important;
      top: 50% !important; left: 50% !important;
      transform: translate(-50%, -50%) !important;
      text-align: center !important; pointer-events: none !important; width: 120px !important;
    }
    .met-ring-pct {
      display: block !important; font-size: 28px !important;
      font-weight: 700 !important; line-height: 1.1 !important; margin-bottom: 2px !important;
    }
    .met-ring-pct.azul  { color: #2264b8 !important; }
    .met-ring-pct.verde { color: #1d8a5c !important; }
    .met-ring-ratio {
      display: block !important; font-size: 14px !important;
      font-weight: 700 !important; color: #1a202c !important; margin-bottom: 2px !important;
    }
    .met-ring-sub { display: block !important; font-size: 11px !important; color: #718096 !important; line-height: 1.3 !important; }

    .met-footer {
      width: 100% !important;
      border-top: 1px solid #edf2f7 !important;
      padding-top: 12px !important; margin-top: auto !important;
      display: flex !important; align-items: center !important;
      justify-content: space-between !important; gap: 8px !important;
      position: relative !important; z-index: 1 !important;
    }
    .met-pendiente-row { display: flex !important; align-items: center !important; gap: 8px !important; }
    .met-pendiente-row img { width: 22px !important; height: 22px !important; object-fit: contain !important; flex-shrink: 0 !important; }
    .met-pendiente-txt { font-size: 12px !important; color: #4a5568 !important; line-height: 1.4 !important; }
    .met-pendiente-txt strong { display: block !important; font-size: 13px !important; font-weight: 600 !important; color: #2d3748 !important; }

    .met-link-descarga {
      display: flex !important; align-items: center !important; gap: 5px !important;
      font-size: 13px !important; font-weight: 600 !important;
      text-decoration: none !important; white-space: nowrap !important;
      flex-shrink: 0 !important; padding: 6px 10px !important;
      border-radius: 8px !important; transition: background 0.15s !important;
    }
    .met-link-descarga.azul  { color: #2264b8 !important; }
    .met-link-descarga.verde { color: #1d8a5c !important; }
    .met-link-descarga:hover { background: #f4f7fb !important; text-decoration: none !important; }
    .met-link-descarga img { width: 15px !important; height: 15px !important; object-fit: contain !important; }

    /* Responsive */
    @media (max-width: 374px) {
      .met-contenedor { flex-direction: column !important; }
      .met-contenedor.solo .met-card { flex: 1 1 100% !important; max-width: 100% !important; }
    }
    @media (min-width: 375px) and (max-width: 767px) {
      .met-contenedor { gap: 10px !important; }
      .met-contenedor.solo .met-card { flex: 1 1 100% !important; max-width: 100% !important; }
      .met-card { padding: 16px 12px 14px !important; }
      .met-ring-wrap { width: 120px !important; height: 120px !important; }
      .met-ring-wrap svg { width: 120px !important; height: 120px !important; }
      .met-ring-pct { font-size: 20px !important; }
      .met-ring-ratio { font-size: 11px !important; }
      .met-ring-sub { font-size: 10px !important; }
      .met-ring-label { width: 95px !important; }
      .met-titulo { font-size: 13px !important; }
      .met-link-descarga { font-size: 12px !important; padding: 4px 6px !important; }
    }
    @media (min-width: 768px) and (max-width: 1023px) {
      .met-ring-wrap { width: 140px !important; height: 140px !important; }
      .met-ring-wrap svg { width: 140px !important; height: 140px !important; }
    }
  </style>

  <div class="met-contenedor <% if(Integer.parseInt(zCantEvaluadosRepIndirectos) != 0){ %>doble<% }else{ %>solo<% } %>">

    <!-- EQUIPO DIRECTO -->
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
          <%-- El offset final calculado en Java se inyecta directo en el atributo SVG --%>
          <circle class="met-ring-fill azul" id="ringDir"
                  cx="80" cy="80" r="65"
                  transform="rotate(-90 80 80)"/>
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

    <!-- EQUIPO COMPLETO (solo si tiene indirectos) -->
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
          <circle class="met-ring-fill verde" id="ringInd"
                  cx="80" cy="80" r="65"
                  transform="rotate(-90 80 80)"/>
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

  <%-- JS: solo se encarga de la animación. El offset final viene de Java. --%>
  <script>
  (function() {
    function animarAnillo(id, offsetFinal) {
      var el = document.getElementById(id);
      if (!el) return;
      /* Forzar estado inicial cerrado con !important via cssText */
      el.style.cssText += '; stroke-dasharray: 408.41 !important; stroke-dashoffset: 408.41 !important; transition: none !important;';
      setTimeout(function() {
        el.style.cssText += '; transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1) !important; stroke-dashoffset: ' + offsetFinal + ' !important;';
      }, 100);
    }

    document.addEventListener('DOMContentLoaded', function() {
      animarAnillo('ringDir', <%= offsetDirStr %>);
      animarAnillo('ringInd', <%= offsetIndStr %>);
    });
  })();
  </script>

</body>
</html>
