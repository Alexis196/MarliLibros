import { ProductForm } from '@/components/admin/ProductForm';

export default function NuevoProductoPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#345457', fontFamily: 'var(--font-playfair)' }}>
        Nuevo producto
      </h1>
      <ProductForm />
    </div>
  );
}
