import { NextRequest, NextResponse } from "next/server";
import { listGasFiles, readGasFile } from "@/lib/gas-files";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("path");

  if (!target) {
    const files = await listGasFiles();
    return NextResponse.json({ ok: true, files });
  }

  try {
    const content = await readGasFile(target);
    return NextResponse.json({ ok: true, path: target, content });
  } catch {
    return NextResponse.json({ ok: false, error: "File tidak ditemukan" }, { status: 404 });
  }
}
