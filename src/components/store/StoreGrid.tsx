"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "./ProductCard";
import { Car, Star, Package, Gift, SquaresFour } from "@phosphor-icons/react";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image: string;
  category: string;
  categorySlug: string;
  featured: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case "veiculos":
      return <Car size={18} weight="duotone" className="mr-2" />;
    case "vips":
      return <Star size={18} weight="duotone" className="mr-2" />;
    case "planos":
      return <Package size={18} weight="duotone" className="mr-2" />;
    case "drops":
      return <Gift size={18} weight="duotone" className="mr-2" />;
    case "todos":
      return <SquaresFour size={18} weight="duotone" className="mr-2" />;
    default:
      return null;
  }
};

export function StoreGrid() {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const params = activeCategory !== "todos" ? `?category=${activeCategory}` : "";
        const res = await fetch(`/api/products${params}`);
        
        if (!res.ok) throw new Error("Erro ao carregar produtos");
        
        const data = await res.json();
        setProducts(data.products);
        
        // Categorias só carregam uma vez
        if (categories.length === 0 && data.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const allCategories = [
    { id: 0, name: "Todos", slug: "todos", icon: null },
    ...categories,
  ];

  return (
    <section id="store" className="py-32 px-6 relative max-w-[1400px] mx-auto w-full">
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-4">
            Catálogo Oficial
          </h2>
          <p className="text-lg text-zinc-400">
            Filtre por categorias e encontre seu próximo veículo ou pacote de vantagens em Detroit.
          </p>
        </div>

        <div className="flex bg-zinc-900 border border-white/5 rounded-full p-1 self-start md:self-end overflow-x-auto no-scrollbar max-w-full">
          {allCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`relative px-5 py-2.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors flex items-center ${
                activeCategory === cat.slug ? "text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {activeCategory === cat.slug && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center">
                {getCategoryIcon(cat.slug)}
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* LOADING SKELETON */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[1.5rem] bg-zinc-900/40 border border-white/5 overflow-hidden animate-pulse"
            >
              <div className="h-44 bg-zinc-800/50" />
              <div className="p-5 space-y-3">
                <div className="h-6 bg-zinc-800 rounded w-3/4" />
                <div className="h-4 bg-zinc-800/60 rounded w-1/2" />
                <div className="mt-6 flex items-end justify-between">
                  <div className="space-y-2">
                    <div className="h-3 bg-zinc-800/40 rounded w-20" />
                    <div className="h-7 bg-zinc-800 rounded w-24" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="w-full py-24 flex flex-col items-center justify-center text-zinc-500 gap-4">
          <p className="text-red-400">❌ {error}</p>
          <button
            onClick={() => setActiveCategory(activeCategory)}
            className="px-4 py-2 rounded-full border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-all"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* GRID */}
      {!loading && !error && (
        <>
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {products.map((product, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={product.id}
                >
                  <ProductCard {...product} index={idx} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          
          {products.length === 0 && (
            <div className="w-full py-24 flex flex-col items-center justify-center text-zinc-500">
              <p>Nenhum produto encontrado nesta categoria.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
