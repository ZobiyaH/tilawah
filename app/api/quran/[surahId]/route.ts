import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: { surahId: string } }
) {
  try {
    const surahId = params?.surahId;
    if (!surahId) {
      return NextResponse.json(
        { error: "Surah ID is required" },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), "data", "quran-uthmani.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Quran data file not found" },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const fullQuranData = JSON.parse(fileContent);

    const surahData = fullQuranData[surahId];
    if (!surahData) {
      return NextResponse.json(
        { error: `Surah with ID '${surahId}' not supported` },
        { status: 404 }
      );
    }

    return NextResponse.json(surahData);
  } catch (e) {
    console.error("API Error in /api/quran/[surahId]:", e);
    return NextResponse.json(
      { error: "Internal server error reading Quran verses" },
      { status: 500 }
    );
  }
}
