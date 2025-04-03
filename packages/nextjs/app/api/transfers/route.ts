import { NextResponse } from 'next/server';
import { query } from "../../../services/mysql/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("tokenId");

  if (!tokenId) {
    return NextResponse.json(
      { error: "缺少 tokenId 参数" },
      { status: 400 }
    );
  }

  try {
    const sql = `
      SELECT * FROM transfers 
      WHERE token_id = ? 
      ORDER BY timestamp DESC
    `;
    const transfers = await query(sql, [tokenId]);

    return NextResponse.json(transfers);
  } catch (error) {
    console.error("获取交易历史失败:", error);
    return NextResponse.json(
      { error: "获取交易历史失败" },
      { status: 500 }
    );
  }
} 