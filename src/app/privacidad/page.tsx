import { InfoPage } from '@/components/InfoPage';

export default function PrivacidadPage() {
  return (
    <InfoPage title="Política de privacidad" draft>
      <p>Última actualización: junio de 2026.</p>

      <h2>1. Datos que recolectamos</h2>
      <p>
        Recolectamos los datos que nos proporcionás al crear una cuenta o realizar una compra:
        nombre, email, teléfono y dirección de envío.
      </p>

      <h2>2. Uso de los datos</h2>
      <p>
        Usamos tus datos exclusivamente para procesar pedidos, gestionar envíos, responder
        consultas y, si lo autorizás, enviarte novedades por email. No vendemos ni compartimos
        tus datos con terceros, salvo los proveedores necesarios para operar (pasarela de pago y
        servicio de envíos).
      </p>

      <h2>3. Conservación de los datos</h2>
      <p>
        Conservamos tus datos mientras mantengas una cuenta activa o según lo requiera la
        normativa fiscal y comercial vigente en Argentina (Ley 25.326 de Protección de Datos
        Personales).
      </p>

      <h2>4. Tus derechos</h2>
      <p>
        Podés solicitar acceso, rectificación o eliminación de tus datos personales en cualquier
        momento escribiéndonos desde la sección <a href="/contacto" className="underline hover:text-[#345457]">Contacto</a>.
        La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la
        Ley 25.326, tiene la atribución de atender denuncias y reclamos que interpongan quienes
        resulten afectados en sus derechos.
      </p>

      <h2>5. Cookies</h2>
      <p>
        Este sitio puede usar cookies técnicas para mantener tu sesión y el contenido de tu
        carrito de compras. No utilizamos cookies de seguimiento publicitario de terceros.
      </p>
    </InfoPage>
  );
}
