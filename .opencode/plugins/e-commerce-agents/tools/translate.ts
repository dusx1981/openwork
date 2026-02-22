import { tool } from "@opencode-ai/plugin";

export const translateContent = tool({
  description: "跨语言内容翻译，适用于产品文案、客服对话",
  args: {
    content: tool.schema.string().describe("待翻译内容"),
    source_lang: tool.schema.string().describe("源语言"),
    target_lang: tool.schema.string().describe("目标语言"),
    style: tool.schema.string().optional().describe("翻译风格"),
  },
  async execute(args: { content: string; source_lang: string; target_lang: string; style?: string }) {
    const { content, source_lang, target_lang, style = "formal" } = args;

    const translations: Record<string, Record<string, string>> = {
      "en-cn": {
        "Shop Now": "立即购买",
        "Free Shipping": "免费配送",
        "30-Day Return": "30天退换",
        "Premium Quality": "优质品质",
      },
      "cn-en": {
        "立即购买": "Shop Now",
        "免费配送": "Free Shipping",
        "30天退换": "30-Day Return",
        "优质品质": "Premium Quality",
      },
    };

    const key = `${source_lang}-${target_lang}`;
    let translated = content;

    if (translations[key]) {
      for (const [src, dst] of Object.entries(translations[key])) {
        translated = translated.replace(new RegExp(src, "gi"), dst);
      }
    }

    if (translated === content) {
      translated = `[${target_lang}] ${content}`;
    }

    const result = {
      original: content,
      translated,
      sourceLang: source_lang,
      targetLang: target_lang,
      style,
      alternatives: [
        { text: translated, confidence: 0.9 },
      ],
      localizedAt: new Date().toISOString(),
    };

    return JSON.stringify(result, null, 2);
  },
});
