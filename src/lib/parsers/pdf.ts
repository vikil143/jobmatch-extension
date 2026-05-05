import * as pdfjsLib from "pdfjs-dist";

// Worker is served from the extension root (copied to public/ at install time)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  chrome.runtime.getURL("pdf.worker.min.mjs");

function isTextItem(item: unknown): item is { str: string; hasEOL: boolean } {
  return typeof item === "object" && item !== null && "str" in item;
}

export async function parsePdfToText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    }).promise;
    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => {
          if (!isTextItem(item)) return "";
          return item.str + (item.hasEOL ? "\n" : "");
        })
        .join("");
      pages.push(text);
    }

    return pages.join("\n\n");
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : String(error)
    console.error('Error parsing PDF:', msg)
    throw new Error(msg)
  }
}
