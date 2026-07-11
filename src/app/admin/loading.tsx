import { PageLoader } from '@/components/MarliLoader';

// Cubre toda la sección /admin/*: el sidebar (definido en admin/layout.tsx) queda
// montado y solo el área de contenido muestra el loader mientras navegás.
export default function AdminLoading() {
  return <PageLoader background="#F7F6F2" label="Cargando…" />;
}
