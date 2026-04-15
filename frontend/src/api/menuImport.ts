import { api } from "./client";
import { normalizeCurrencyValue, normalizeNumber } from "../utils/currency";

function normalizeMenuImportPayload(payload: any) {
  const items = Array.isArray(payload?.items)
    ? payload.items.map((item: any) => ({
        name: String(item?.name ?? ""),
        categoryName: String(item?.categoryName ?? "Sem categoria"),
        price: normalizeCurrencyValue(item?.price),
      }))
    : [];

  return {
    ...payload,
    count: normalizeNumber(payload?.count, items.length) || items.length,
    createdCount: normalizeNumber(payload?.createdCount, items.length) || items.length,
    rawText: typeof payload?.rawText === "string" ? payload.rawText : "",
    fileName: typeof payload?.fileName === "string" ? payload.fileName : "",
    items,
  };
}

export async function previewMenuImport(rawText: string) {
  const { data } = await api.post("/menu-import/preview", { rawText });
  return normalizeMenuImportPayload(data);
}

export async function importMenuFromText(rawText: string) {
  const { data } = await api.post("/menu-import/text", { rawText });
  return normalizeMenuImportPayload(data);
}

export async function importMenuFromFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/menu-import/file", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return normalizeMenuImportPayload(data);
}
