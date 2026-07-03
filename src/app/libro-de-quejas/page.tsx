import { InfoPage } from '@/components/InfoPage';

export default function LibroDeQuejasPage() {
  return (
    <InfoPage title="Libro de quejas" draft>
      <p>
        En cumplimiento de la normativa de defensa del consumidor, podés dejar tu queja o reclamo
        sobre una compra realizada en Marli Libros escribiéndonos desde la sección{' '}
        <a href="/contacto" className="underline hover:text-[#345457]">Contacto</a>, indicando tu número de
        pedido y el detalle del reclamo. Te responderemos a la brevedad.
      </p>
      <p>
        Como consumidor, también tenés derecho a realizar tu reclamo ante la Dirección Nacional de
        Defensa del Consumidor a través de la plataforma oficial de{' '}
        <span className="text-gray-500">COMPRAR PROTEGIDO</span> del Gobierno de Argentina.
      </p>
    </InfoPage>
  );
}
