import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ProductRow {
  id: number;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: number;
  category_name: string;
  category_slug: string;
  active: boolean;
  featured: boolean;
  created_at: string;
}

interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get("category");

    // Buscar categorias
    const categories = await query<CategoryRow>(
      "SELECT id, name, slug, icon, sort_order FROM categories ORDER BY sort_order ASC"
    );

    // Buscar produtos com join na categoria
    let productsSql = `
      SELECT 
        p.id, p.title, p.description, p.price, p.image_url,
        p.category_id, p.active, p.featured, p.created_at,
        c.name as category_name, c.slug as category_slug
      FROM products p
      INNER JOIN categories c ON p.category_id = c.id
      WHERE p.active = 1
    `;
    const params: string[] = [];

    if (categorySlug && categorySlug !== "todos") {
      productsSql += " AND c.slug = ?";
      params.push(categorySlug);
    }

    productsSql += " ORDER BY p.featured DESC, p.created_at DESC";

    const products = await query<ProductRow>(productsSql, params);

    return Response.json({
      products: products.map((p) => ({
        id: String(p.id),
        title: p.title,
        description: p.description,
        price: Number(p.price),
        image: p.image_url || "",
        category: p.category_name,
        categorySlug: p.category_slug,
        featured: Boolean(p.featured),
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
      })),
    });
  } catch (error) {
    console.error("❌ Erro ao buscar produtos:", error);
    return Response.json(
      { error: "Erro interno ao buscar produtos." },
      { status: 500 }
    );
  }
}
