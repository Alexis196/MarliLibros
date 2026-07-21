import { InfoPage } from '@/components/InfoPage';

export default function EnviosPage() {
  return (
    <InfoPage title="Envíos">
      <p>
        Realizamos envíos a todo el país con una tarifa fija de $5.000, que se muestra antes de
        confirmar la compra en el paso de checkout. También podés elegir retirar tu pedido en
        persona sin costo.
      </p>

      <h2>Plazos estimados</h2>
      <p>
        24–48 horas hábiles en CABA y GBA. Para el resto del país, el plazo depende de la
        empresa de logística y la localidad de destino.
      </p>

      <h2>Seguimiento</h2>
      <p>
        Una vez despachado tu pedido, te enviamos un email de confirmación. Si tenés dudas sobre
        el estado de tu envío, podés escribirnos desde <a href="/contacto" className="underline hover:text-[#345457]">Contacto</a>.
      </p>

      <h2>Cambios y devoluciones</h2>
      <p>
        Si recibiste un producto dañado o querés gestionar una devolución, revisá nuestra sección
        de <a href="/terminos" className="underline hover:text-[#345457]">Términos y condiciones</a> o contactanos directamente.
      </p>
    </InfoPage>
  );
}
