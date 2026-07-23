import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { Product } from "../types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/api").replace(/\/api\/?$/, "");

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function loadProducts() {
    api.get("/products").then((res) => setProducts(res.data));
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price);
      if (photo) {
        formData.append("photo", photo);
      }
      await api.post("/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setName("");
      setPrice("");
      setPhoto(null);
      loadProducts();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/products/${id}`);
    loadProducts();
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Produtos</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Preço</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-28 rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Foto</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="rounded-lg border bg-white p-3 shadow-sm">
            <div className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded bg-gray-100">
              {product.photoUrl ? (
                <img
                  src={`${apiBaseUrl}${product.photoUrl}`}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-400">Sem foto</span>
              )}
            </div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-500">{currencyFormatter.format(Number(product.price))}</p>
            <button
              onClick={() => handleDelete(product.id)}
              className="mt-2 text-xs text-red-600 hover:underline"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
