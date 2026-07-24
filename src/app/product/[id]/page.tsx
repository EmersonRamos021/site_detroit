import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BuyButton } from "./BuyButton";
import ReactMarkdown from "react-markdown";

interface ProductDetail {
  id: number;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_name: string;
  category_slug: string;
  featured: boolean;
  created_at: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const products = await query<ProductDetail>(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p INNER JOIN categories c ON p.category_id = c.id
     WHERE p.id = ? AND p.active = 1`,
    [id]
  );

  if (products.length === 0) {
    return { title: "Produto não encontrado | Detroit Roleplay" };
  }

  const product = products[0];
  return {
    title: `${product.title} | Detroit Roleplay Store`,
    description: product.description || `Compre ${product.title} na loja oficial Detroit Roleplay`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const products = await query<ProductDetail>(
    `SELECT p.id, p.title, p.description, p.price, p.image_url, p.featured, p.created_at,
            c.name as category_name, c.slug as category_slug
     FROM products p
     INNER JOIN categories c ON p.category_id = c.id
     WHERE p.id = ? AND p.active = 1`,
    [id]
  );

  if (products.length === 0) {
    notFound();
  }

  const product = products[0];

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 px-6">
      <div className="max-w-[1400px] mx-auto">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-10">
          <Link href="/" className="hover:text-zinc-300 transition-colors">
            Início
          </Link>
          <span className="text-zinc-700">/</span>
          <Link href="/#store" className="hover:text-zinc-300 transition-colors">
            Loja
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-300">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* PRODUCT IMAGE */}
          <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/5 group">
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 to-zinc-800/80 z-0" />
            {product.image_url && (
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover z-10 group-hover:scale-105 transition-transform duration-700 ease-out"
                priority
              />
            )}
            {product.featured && (
              <div className="absolute top-5 right-5 z-20 px-3 py-1.5 rounded-full bg-[var(--color-detroit-red)]/90 backdrop-blur-md text-xs font-bold text-white uppercase tracking-widest">
                ★ Destaque
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div className="flex flex-col">
            {/* Category badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-zinc-900/50 text-sm font-medium text-zinc-400 w-fit mb-6">
              {product.category_name}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-4">
              {product.title}
            </h1>

            <div className="text-base text-zinc-400 leading-relaxed mb-8 max-w-[65ch] markdown-content">
              {product.description ? (
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mt-8 mb-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-white mt-8 mb-4" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold text-white mt-6 mb-3" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-lg font-bold text-white mt-6 mb-3" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-zinc-400" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-zinc-400 marker:text-[var(--color-detroit-red)]" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-zinc-400 marker:text-[var(--color-detroit-red)]" {...props} />,
                    li: ({node, ...props}) => <li className="ml-4" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-zinc-200" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-6 border-white/10" {...props} />,
                    a: ({node, ...props}) => <a className="text-[var(--color-detroit-red)] hover:underline" {...props} />,
                  }}
                >
                  {product.description}
                </ReactMarkdown>
              ) : (
                <p>Entrega imediata in-game após a confirmação do pagamento.</p>
              )}
            </div>

            {/* PRICE */}
            <div className="flex flex-col gap-1 mb-10">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Valor
              </span>
              <span className="text-5xl font-mono tracking-tighter text-white font-bold">
                R$ {Number(product.price).toFixed(2)}
              </span>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-4">
              <BuyButton productId={product.id} productTitle={product.title} price={Number(product.price)} image={product.image_url || ""} categorySlug={product.category_slug} />
            </div>

            {/* DETAILS */}
            <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Entrega</span>
                <span className="text-sm text-zinc-300">Imediata in-game</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Categoria</span>
                <span className="text-sm text-zinc-300">{product.category_name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Disponibilidade</span>
                <span className="text-sm text-emerald-400">Em estoque</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Tipo</span>
                <span className="text-sm text-zinc-300">Produto digital</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
