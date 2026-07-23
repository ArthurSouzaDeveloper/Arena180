import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api, fileUrl } from '../lib/api';
import { Product, ProductCategory } from '../types';

export default function Produtos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('BEBIDA');
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.get<Product[]>('/products').then((res) => setProducts(res.data));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('category', category);
      form.append('price', price);
      if (photo) form.append('photo', photo);

      await api.post('/products', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setName('');
      setPrice('');
      setPhoto(null);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    await api.delete(`/products/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Produtos</h1>
      <p className="mt-1 text-sm text-gray-500">Bebidas e comidas vendidas na sua quadra, com foto e preço.</p>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Água mineral 500ml"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="BEBIDA">Bebida</option>
            <option value="COMIDA">Comida</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Foto</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </div>
        <div className="flex items-end lg:col-span-5">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <Plus size={16} />
            Adicionar produto
          </button>
        </div>
      </form>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-md bg-gray-100">
              {product.photoUrl ? (
                <img src={fileUrl(product.photoUrl)} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">Sem foto</span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">{product.name}</p>
            <p className="text-xs text-gray-500">{product.category === 'BEBIDA' ? 'Bebida' : 'Comida'}</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-700">
                {Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <button onClick={() => handleRemove(product.id)} className="text-gray-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="col-span-full text-sm text-gray-500">Nenhum produto cadastrado ainda.</p>}
      </div>
    </div>
  );
}
