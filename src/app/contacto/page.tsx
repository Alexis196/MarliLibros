import { InfoPage } from '@/components/InfoPage';

// TODO: completar con los datos reales de contacto del negocio.
const CONTACT_EMAIL = '';
const CONTACT_PHONE = '';

export default function ContactoPage() {
  return (
    <InfoPage title="Contacto">
      <p>¿Tenés una consulta sobre tu pedido, un libro o cualquier otra cosa? Escribinos.</p>

      {CONTACT_EMAIL ? (
        <p>
          <strong className="text-[#345457]">Email:</strong>{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-[#345457]">{CONTACT_EMAIL}</a>
        </p>
      ) : (
        <p className="text-gray-400 italic">Email de contacto: próximamente.</p>
      )}

      {CONTACT_PHONE && (
        <p>
          <strong className="text-[#345457]">Teléfono / WhatsApp:</strong> {CONTACT_PHONE}
        </p>
      )}

      <p className="text-[13px] text-gray-400">
        Respondemos consultas en horario comercial, de lunes a viernes.
      </p>
    </InfoPage>
  );
}
