import { PageLoader } from '@/components/MarliLoader';

// Next.js muestra esto automáticamente en cada navegación de página mientras
// se resuelve la ruta — no hace falta importarlo a mano en ningún lado.
export default function Loading() {
  return <PageLoader />;
}
