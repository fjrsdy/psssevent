import { NextResponse } from "next/server";
import JSZip from "jszip";
import { GAS_FILES, readGasFile } from "@/lib/gas-files";

export const dynamic = "force-dynamic";

/** Unduh seluruh proyek Apps Script sebagai arsip ZIP siap di-copy ke editor */
export async function GET() {
  const zip = new JSZip();
  const root = zip.folder("simanev-pssdm-google-apps-script");

  for (const meta of GAS_FILES) {
    try {
      const content = await readGasFile(meta.path);
      root?.file(meta.path, content);
    } catch {
      // lewati file yang gagal dibaca
    }
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition":
        'attachment; filename="simanev-pssdm-google-apps-script.zip"',
      "Cache-Control": "no-store",
    },
  });
}
