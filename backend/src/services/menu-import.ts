type ParsedMenuItem = {
  name: string;
  price: number;
  categoryName: string;
  description: string;
  productType: "SINGLE" | "COMBO" | "ADDON";
  tags: string[];
};

const categoryMatchers = [
  { pattern: /combo/i, categoryName: "Combos", productType: "COMBO" as const, tags: ["combo", "ticket-medio"] },
  { pattern: /coca|guarana|fanta|refri|suco|agua/i, categoryName: "Bebidas", productType: "SINGLE" as const, tags: ["bebida"] },
  { pattern: /batata|anel|nugget|fritas/i, categoryName: "Acompanhamentos", productType: "ADDON" as const, tags: ["upsell"] }
];

export function extractTextFromBuffer(buffer: Buffer) {
  return buffer
    .toString("latin1")
    .replace(/[^\x20-\x7E\n\r]/g, " ")
    .replace(/\s{2,}/g, " ");
}

export function parseMenuInput(rawInput: string) {
  const lines = rawInput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items: ParsedMenuItem[] = [];

  for (const line of lines) {
    const match =
      line.match(/^(?<name>.+?)\s*[-–]\s*R?\$?\s*(?<price>\d+[,.]?\d*)$/i) ||
      line.match(/^(?<name>.+?)\s+(?<price>\d+[,.]?\d*)$/i);

    if (!match?.groups?.name || !match.groups.price) {
      continue;
    }

    const name = match.groups.name.trim();
    const price = Number(match.groups.price.replace(",", "."));

    if (!name || Number.isNaN(price)) {
      continue;
    }

    const categoryMatch = categoryMatchers.find((entry) => entry.pattern.test(name));
    const productType = categoryMatch?.productType || "SINGLE";
    const categoryName = categoryMatch?.categoryName || "Hamburgueres";
    const tags = categoryMatch?.tags || ["burger"];

    items.push({
      name,
      price,
      categoryName,
      productType,
      tags,
      description: buildDescription(name, categoryName)
    });
  }

  return items;
}

function buildDescription(name: string, categoryName: string) {
  if (categoryName === "Combos") {
    return `${name} montado para elevar conversao e facilitar a escolha do cliente.`;
  }

  if (categoryName === "Bebidas") {
    return `${name} gelada para complementar o pedido.`;
  }

  if (categoryName === "Acompanhamentos") {
    return `${name} como adicional de alto giro para aumentar o ticket medio.`;
  }

  return `${name} preparado para vender mais no cardapio digital.`;
}

