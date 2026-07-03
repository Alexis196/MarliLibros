import { InfoPage } from '@/components/InfoPage';

const FAQS = [
  {
    q: '¿Cómo hago un pedido?',
    a: 'Elegí los libros que querés desde el catálogo, agregalos al carrito y completá el checkout con tus datos de envío y pago.',
  },
  {
    q: '¿Qué medios de pago aceptan?',
    a: 'Aceptamos tarjetas de crédito y débito, y transferencia bancaria, todo procesado a través de Mercado Pago.',
  },
  {
    q: '¿Cuánto demora el envío?',
    a: 'Entre 24 y 48 horas hábiles en CABA y GBA. Para el resto del país, el plazo se informa en el checkout según tu código postal.',
  },
  {
    q: '¿Puedo cambiar o devolver un libro?',
    a: 'Sí, tenés 10 días corridos desde la recepción para solicitar un cambio o devolución, siempre que el producto esté en las mismas condiciones en que lo recibiste.',
  },
  {
    q: '¿Cómo sé si un libro está disponible?',
    a: 'Si el libro aparece en el catálogo, está disponible. Si una categoría muestra "Próximamente", significa que todavía no tenemos stock en esa categoría.',
  },
];

export default function FaqPage() {
  return (
    <InfoPage title="Preguntas frecuentes">
      {FAQS.map(({ q, a }) => (
        <div key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </div>
      ))}
    </InfoPage>
  );
}
