import { NextResponse } from 'next/server';
import { query } from "../../../../services/mysql/db";

export async function POST(request: Request) {
  try {
    const nftData = await request.json();

    if (!nftData.tokenId || !nftData.name || !nftData.image || !nftData.owner) {
      return NextResponse.json(
        { error: "缺少必要字段" },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO nfts (
        id,
        name,
        image,
        description,
        owner,
        price,
        cid,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      nftData.tokenId,        
      nftData.name,
      nftData.image,
      nftData.description || '',
      nftData.owner,
      nftData.price || null,
      nftData.ipfsCID || ''   
    ];

    await query(sql, values);

    return NextResponse.json({ 
      success: true, 
      message: "NFT数据保存成功" 
    });

  } catch (error) {
    console.error("保存NFT数据错误:", error);
    return NextResponse.json(
      { error: "保存NFT数据失败" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sql = 'SELECT * FROM nfts';
    const rows = await query(sql);

    return NextResponse.json({ 
      success: true, 
      data: rows 
    });
  } catch (error) {
    console.error('数据库错误:', error);
    return NextResponse.json(
      { success: false, message: '获取NFT列表失败' },
      { status: 500 }
    );
  }
} 