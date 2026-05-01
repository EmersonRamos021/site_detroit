import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    
    return NextResponse.json({
      status: "online",
      database: "connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: "degraded",
      database: "disconnected",
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
