import { api } from "./client";

export async function previewMenuImport(rawText: string) {
  const { data } = await api.post("/menu-import/preview", { rawText });
  return data;
}

export async function importMenuFromText(rawText: string) {
  const { data } = await api.post("/menu-import/text", { rawText });
  return data;
}

export async function importMenuFromFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/menu-import/file", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return data;
}

