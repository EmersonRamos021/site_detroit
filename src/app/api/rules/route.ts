import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const rules = await query(`SELECT * FROM rules ORDER BY order_index ASC`);
    
    // Transform into the format expected by the frontend
    const formattedData = {
      title: "Regulamento Detroit Roleplay",
      sections: rules.map((r: any) => ({
        id: r.id,
        title: r.title,
        html: r.html
      }))
    };
    
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Erro ao buscar regras:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
