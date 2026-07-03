import { InfoPage } from '@/components/InfoPage';

export default function FormasDePagoPage() {
  return (
    <InfoPage title="Formas de pago">
      <p>Podés pagar tu compra con cualquiera de estos medios, procesados a través de Mercado Pago:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Tarjetas de crédito (Visa, Mastercard y otras marcas habilitadas en Mercado Pago).</li>
        <li>Tarjetas de débito.</li>
        <li>Transferencia bancaria.</li>
        <li>Dinero en cuenta de Mercado Pago.</li>
      </ul>
      <p>
        Todos los pagos se procesan con la seguridad de Mercado Pago; Marli Libros no almacena
        datos de tarjetas en sus propios servidores.
      </p>
    </InfoPage>
  );
}
