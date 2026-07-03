import { InfoPage } from '@/components/InfoPage';

export default function TerminosPage() {
  return (
    <InfoPage title="Términos y condiciones" draft>
      <p>Última actualización: junio de 2026.</p>

      <h2>1. Objeto</h2>
      <p>
        Estos Términos y Condiciones regulan el uso del sitio Marli Libros y la compra de productos
        ofrecidos a través de él. Al utilizar este sitio o realizar una compra, aceptás estos términos.
      </p>

      <h2>2. Productos y precios</h2>
      <p>
        Los precios publicados están expresados en pesos argentinos (ARS) e incluyen los impuestos
        de ley vigentes al momento de la publicación. Marli Libros se reserva el derecho de modificar
        precios y disponibilidad de stock sin previo aviso.
      </p>

      <h2>3. Proceso de compra y pago</h2>
      <p>
        Los pagos se procesan a través de Mercado Pago. La confirmación del pedido se realiza una vez
        que el pago es acreditado. En caso de no acreditarse el pago, el pedido se cancela automáticamente.
      </p>

      <h2>4. Envíos</h2>
      <p>
        Los plazos y costos de envío se informan en la sección <a href="/envios" className="underline hover:text-[#345457]">Envíos</a>{' '}
        y/o al finalizar la compra, antes de confirmar el pago.
      </p>

      <h2>5. Cambios y devoluciones</h2>
      <p>
        De acuerdo con la Ley de Defensa del Consumidor (Ley 24.240), el cliente dispone de 10 días
        corridos desde la recepción del producto para solicitar su devolución, siempre que el producto
        se encuentre en las mismas condiciones en que fue entregado.
      </p>

      <h2>6. Propiedad intelectual</h2>
      <p>
        Todos los contenidos de este sitio (textos, imágenes, diseño) son propiedad de Marli Libros
        o de sus respectivos titulares, y no pueden reproducirse sin autorización.
      </p>

      <h2>7. Contacto</h2>
      <p>
        Para consultas sobre estos términos, podés escribirnos desde la sección{' '}
        <a href="/contacto" className="underline hover:text-[#345457]">Contacto</a>.
      </p>
    </InfoPage>
  );
}
