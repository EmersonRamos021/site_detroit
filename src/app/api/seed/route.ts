import { runSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await runSeed();
    return Response.json({
      success: true,
      message: "Seed executado com sucesso!",
      created: result,
    });
  } catch (error) {
    console.error("❌ Erro no seed:", error);
    return Response.json(
      {
        error: "Erro ao executar seed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
