<style>
  /* ===== MÉTRICAS EQUIPO ===== */
  .contenedor-tarjetas-seg {
    display: flex !important;
    flex-direction: row !important;
    gap: 16px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  /* Una sola card: ocupa todo el ancho */
  .contenedor-tarjetas-seg:not(.contenedor-tarjetas2-seg) .contenido__equipo {
    flex: 1 1 100% !important;
    max-width: 100% !important;
  }

  /* Dos cards: mitad cada una */
  .contenedor-tarjetas2-seg .contenido__equipo,
  .contenedor-tarjetas2-seg .contenido__equipo2-seg {
    flex: 1 1 0 !important;
    min-width: 0 !important;
  }

  .contenido__equipo,
  .contenido__equipo2-seg {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 16px !important;
    padding: 20px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 14px !important;
    box-sizing: border-box !important;
    position: relative !important;
    overflow: hidden !important;
  }

  /* Ola decorativa de fondo */
  .contenido__equipo::after,
  .contenido__equipo2-seg::after {
    content: '' !important;
    position: absolute !important;
    bottom: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 60px !important;
    background: rgba(24, 95, 165, 0.05) !important;
    border-radius: 50% 50% 0 0 / 30px 30px 0 0 !important;
    pointer-events: none !important;
  }

  .contenido__equipo__titulo {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: #1a202c !important;
    margin: 0 !important;
    padding-right: 48px !important; /* espacio para el ícono */
  }

  /* Ícono flotante arriba a la derecha */
  .contenido__equipo__img {
    position: absolute !important;
    top: 16px !important;
    right: 16px !important;
    width: 40px !important;
    height: 40px !important;
    background: #f1f5f9 !important;
    border-radius: 50% !important;
    padding: 8px !important;
    box-sizing: border-box !important;
    object-fit: contain !important;
  }

  /* Ratio completados/total */
  .contenido__equipo__pendiente {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }

  .equipo__pendiente__img {
    width: 20px !important;
    height: 20px !important;
    object-fit: contain !important;
    flex-shrink: 0 !important;
  }

  .contenido__equipo__pendiente p {
    margin: 0 !important;
    font-size: 13px !important;
    color: #4a5568 !important;
  }

  /* Barra de progreso */
  .contenido__equipo__porcentaje {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
  }

  .contenido__equipo__porcentaje .progress {
    flex: 1 !important;
    height: 8px !important;
    background: #e2e8f0 !important;
    border-radius: 999px !important;
    overflow: hidden !important;
  }

  .contenido__equipo__porcentaje .progress-bar {
    height: 100% !important;
    border-radius: 999px !important;
    transition: width 0.6s ease !important;
  }

  .nro-porcentaje {
    font-size: 13px !important;
    font-weight: 600 !important;
    white-space: nowrap !important;
    min-width: 36px !important;
    text-align: right !important;
  }

  .porcentaje-verde  { color: #276749 !important; }
  .porcentaje-amarillo { color: #975a16 !important; }
  .porcentaje-rojo   { color: #9b2c2c !important; }
  .porcentaje100     { color: #276749 !important; }

  /* Fila inferior: pendiente + descarga en la misma línea */
  .contenido__equipo__descarga {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 8px !important;
    padding-top: 10px !important;
    border-top: 1px solid #e2e8f0 !important;
    position: relative !important;
    z-index: 1 !important;
  }

  .contenido__equipo__descarga p {
    margin: 0 !important;
    font-size: 13px !important;
    color: #4a5568 !important;
    white-space: nowrap !important;
  }

  .link-descarga {
    display: flex !important;
    align-items: center !important;
    gap: 5px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #185FA5 !important;
    text-decoration: none !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }

  .link-descarga:hover {
    text-decoration: underline !important;
    color: #0c447c !important;
  }

  .icon-descarga {
    width: 16px !important;
    height: 16px !important;
    object-fit: contain !important;
  }

  /* img-filter (iconos que deben heredar el color del tema) */
  .img-filter {
    filter: none !important;
  }

  /* ===== RESPONSIVE ===== */

  /* iPhone SE / mini (≤374px): stack vertical */
  @media (max-width: 374px) {
    .contenedor-tarjetas-seg,
    .contenedor-tarjetas2-seg {
      flex-direction: column !important;
    }
  }

  /* iPhone 11 / XR en adelante (375px+): lado a lado si hay dos cards */
  @media (min-width: 375px) and (max-width: 767px) {
    .contenedor-tarjetas-seg {
      flex-direction: row !important;
      gap: 12px !important;
    }

    .contenido__equipo,
    .contenido__equipo2-seg {
      padding: 14px !important;
      gap: 10px !important;
    }

    .contenido__equipo__titulo {
      font-size: 13px !important;
    }

    .contenido__equipo__img {
      width: 34px !important;
      height: 34px !important;
      top: 12px !important;
      right: 12px !important;
    }

    .nro-porcentaje {
      font-size: 12px !important;
      min-width: 30px !important;
    }

    .contenido__equipo__descarga p,
    .link-descarga {
      font-size: 12px !important;
    }
  }

  /* Tablets y desktop (768px+) */
  @media (min-width: 768px) {
    .contenido__equipo,
    .contenido__equipo2-seg {
      padding: 22px !important;
    }
  }
</style>

<div class="contenedor-tarjetas-seg <% if( Integer.parseInt(zCantEvaluadosRepIndirectos) != 0 ){ %> contenedor-tarjetas2-seg <%}%>">

  <!-- Equipo directo -->
  <div class="contenido__equipo <% if( Integer.parseInt(zCantEvaluadosRepDirectos) != zTotalEvaluados ){ %> contenido__equipo2-seg <%}%>">
    <h3 class="contenido__equipo__titulo">Equipo directo</h3>
    <img class="contenido__equipo__img img-filter"
         src="/mss_g3/espanol/performance/eval_lider/image/iconos/directo.webp"
         alt="directo-icon">

    <div class="contenido__equipo__pendiente">
      <img class="equipo__pendiente__img img-filter"
           src="/mss_g3/espanol/performance/eval_lider/image/iconos/equipo_directo.webp"
           alt="equipo_directo_icon">
      <p><%=zCantObjConfDirectos%>/<%=zCantEvaluadosRepDirectos%></p>
    </div>

    <div class="contenido__equipo__porcentaje">
      <div class="progress">
        <div id="barraDirecto"
             class="progress-bar progress-responsive"
             role="progressbar"
             aria-label="Porcentaje Directo"
             style="width: <%= porcentajeDirecto %>%; background-color: <%= colorBarraDirecto %>;"
             aria-valuenow="<%= porcentajeDirecto %>"
             aria-valuemin="0"
             aria-valuemax="100">
        </div>
      </div>
      <%if (porcentajeDirecto == 100){%>
        <span class="nro-porcentaje porcentaje100 porcentaje-verde"><%= porcentajeDirecto %>%</span>
      <%}else if(porcentajeDirecto > 61 && porcentajeDirecto < 100){%>
        <span class="nro-porcentaje porcentaje-verde"><%= porcentajeDirecto %>%</span>
      <%}else if(porcentajeDirecto > 31 && porcentajeDirecto < 61){%>
        <span class="nro-porcentaje porcentaje-amarillo"><%= porcentajeDirecto %>%</span>
      <%}else{%>
        <span class="nro-porcentaje porcentaje-rojo"><%= porcentajeDirecto %>%</span>
      <%}%>
    </div>

    <%String zFecStart = com.meta4.taglib.util.M4PresentationUtilTaglib.secureEncrypt(request, "EncCorp76", zDtStart);%>
    <div class="contenido__equipo__descarga">
      <p>Pendiente: <%=pendientesDir%></p>
      <a class="link-descarga" href="javascript:verReporte2('directo');">
        <img class="icon-descarga"
             src="/mss_g3/espanol/performance/eval_lider/image/iconos/descargar.png"
             alt="descargar">
        Descargar
      </a>
    </div>
  </div>

  <!-- Equipo indirecto (solo si tiene subordinados indirectos) -->
  <% if( Integer.parseInt(zCantEvaluadosRepIndirectos) != 0 ){ %>
  <div class="contenido__equipo2-seg">
    <h3 class="contenido__equipo__titulo">Equipo completo</h3>
    <img class="contenido__equipo__img img2 img-filter"
         src="/mss_g3/espanol/performance/eval_lider/image/iconos/indirecto.webp"
         alt="indirecto-icon">

    <div class="contenido__equipo__pendiente">
      <img class="equipo__pendiente__img img-filter"
           src="/mss_g3/espanol/performance/eval_lider/image/iconos/equipo_indirecto.webp"
           alt="#">
      <p><%=zTotalObjConf%>/<%=zTotalEvaluados%></p>
    </div>

    <div class="contenido__equipo__porcentaje">
      <div class="progress">
        <div id="barraIndirecto"
             class="progress-bar progress-responsive"
             role="progressbar"
             aria-label="Porcentaje Indirecto"
             style="width: <%= porcentajeIndirecto %>%; background-color: <%= colorBarraIndirecto %>;"
             aria-valuenow="<%= porcentajeIndirecto %>"
             aria-valuemin="0"
             aria-valuemax="100">
        </div>
      </div>
      <%if (porcentajeIndirecto == 100){%>
        <span class="nro-porcentaje porcentaje100 porcentaje-verde"><%= porcentajeIndirectoStr %>%</span>
      <%}else if(porcentajeIndirecto > 61 && porcentajeIndirecto < 100){%>
        <span class="nro-porcentaje porcentaje-verde"><%= porcentajeIndirectoStr %>%</span>
      <%}else if(porcentajeIndirecto > 31 && porcentajeIndirecto < 61){%>
        <span class="nro-porcentaje porcentaje-amarillo"><%= porcentajeIndirectoStr %>%</span>
      <%}else{%>
        <span class="nro-porcentaje porcentaje-rojo"><%= porcentajeIndirectoStr %>%</span>
      <%}%>
    </div>

    <div class="contenido__equipo__descarga">
      <p>Pendiente: <%=pendientesInd%></p>
      <a class="link-descarga" href="javascript:verReporte2('indirectos');">
        <img class="icon-descarga"
             src="/mss_g3/espanol/performance/eval_lider/image/iconos/descargar.png"
             alt="descargar">
        Descargar
      </a>
    </div>
  </div>
  <%}%>

</div>
