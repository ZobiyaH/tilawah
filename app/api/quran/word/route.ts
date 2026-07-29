import { NextResponse } from "next/server";
import { stripDiacritics } from "@/lib/arabic/normalize";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");

  if (!text) {
    return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
  }

  const cleanTarget = stripDiacritics(text).trim();

  try {
    const url = `https://api.quran.com/api/v4/search?query=${encodeURIComponent(cleanTarget)}&size=1`;
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to search Quran.com" }, { status: res.status });
    }

    const data = await res.json();
    const firstResult = data?.search?.results?.[0];
    if (!firstResult) {
      return NextResponse.json({ error: "Word not found in Quran search" }, { status: 404 });
    }

    const [sId, aId] = firstResult.verse_key.split(":").map(Number);
    let wordIdx = 0;
    let foundIdx = -1;
    if (firstResult.words) {
      for (let i = 0; i < firstResult.words.length; i++) {
        const wObj = firstResult.words[i];
        if (wObj.char_type === "word") {
          wordIdx++;
          if (wObj.highlight || stripDiacritics(wObj.text).trim() === cleanTarget) {
            foundIdx = wordIdx;
            break;
          }
        }
      }
    }

    if (foundIdx === -1) {
      // Default to first word if highlight wasn't marked correctly
      foundIdx = 1;
    }

    const pad3 = (num: number) => String(num).padStart(3, "0");
    const audioUrl = `https://audio.qurancdn.com/wbw/${pad3(sId)}_${pad3(aId)}_${pad3(foundIdx)}.mp3`;

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error("Quran word API proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
