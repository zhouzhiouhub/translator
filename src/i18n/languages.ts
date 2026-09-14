/**
 * Full UI / translation language catalog (aligned with Google Translate coverage).
 * `code` is BCP-47-ish id used for AI target language and optional UI locale packs.
 */

export interface AppLanguage {
  /** Stable id (BCP-47 style). */
  code: string;
  /** Display name in Simplified Chinese. */
  nameZh: string;
  /** Display name in English. */
  nameEn: string;
}

export const APP_LANGUAGES: AppLanguage[] = [
  { code: "ab", nameZh: "阿布哈西亚语", nameEn: "Abkhaz" },
  { code: "sq", nameZh: "阿尔巴尼亚语", nameEn: "Albanian" },
  { code: "aa", nameZh: "阿法尔语", nameEn: "Afar" },
  { code: "ak", nameZh: "阿肯语", nameEn: "Akan" },
  { code: "ar", nameZh: "阿拉伯语", nameEn: "Arabic" },
  { code: "alz", nameZh: "阿卢尔语", nameEn: "Alur" },
  { code: "am", nameZh: "阿姆哈拉语", nameEn: "Amharic" },
  { code: "ach", nameZh: "阿乔利语", nameEn: "Acholi" },
  { code: "as", nameZh: "阿萨姆语", nameEn: "Assamese" },
  { code: "az", nameZh: "阿塞拜疆语", nameEn: "Azerbaijani" },
  { code: "awa", nameZh: "阿瓦德语", nameEn: "Awadhi" },
  { code: "av", nameZh: "阿瓦尔语", nameEn: "Avar" },
  { code: "ee", nameZh: "埃维语", nameEn: "Ewe" },
  { code: "ay", nameZh: "艾马拉语", nameEn: "Aymara" },
  { code: "ga", nameZh: "爱尔兰语", nameEn: "Irish" },
  { code: "et", nameZh: "爱沙尼亚语", nameEn: "Estonian" },
  { code: "oc", nameZh: "奥克语", nameEn: "Occitan" },
  { code: "or", nameZh: "奥里亚语", nameEn: "Odia" },
  { code: "om", nameZh: "奥罗莫语", nameEn: "Oromo" },
  { code: "os", nameZh: "奥塞梯语", nameEn: "Ossetian" },
  { code: "ban", nameZh: "巴厘语", nameEn: "Balinese" },
  { code: "ba", nameZh: "巴什基尔语", nameEn: "Bashkir" },
  { code: "eu", nameZh: "巴斯克语", nameEn: "Basque" },
  { code: "kex", nameZh: "巴塔克卡罗语", nameEn: "Batak Karo" },
  { code: "bts", nameZh: "巴塔克西马隆贡语", nameEn: "Batak Simalungun" },
  { code: "bbc", nameZh: "Batak Toba", nameEn: "Batak Toba" },
  { code: "bci", nameZh: "巴乌雷语", nameEn: "Baoulé" },
  { code: "be", nameZh: "白俄罗斯语", nameEn: "Belarusian" },
  { code: "bm", nameZh: "班巴拉语", nameEn: "Bambara" },
  { code: "pag", nameZh: "邦阿西南语", nameEn: "Pangasinan" },
  { code: "pam", nameZh: "邦板牙语", nameEn: "Kapampangan" },
  { code: "bg", nameZh: "保加利亚语", nameEn: "Bulgarian" },
  { code: "se", nameZh: "北方萨米语", nameEn: "Northern Sami" },
  { code: "nso", nameZh: "北索托语", nameEn: "Northern Sotho" },
  { code: "bem", nameZh: "本巴语", nameEn: "Bemba" },
  { code: "bik", nameZh: "比科尔语", nameEn: "Bikol" },
  { code: "bal", nameZh: "俾路支语", nameEn: "Baluchi" },
  { code: "is", nameZh: "冰岛语", nameEn: "Icelandic" },
  { code: "pl", nameZh: "波兰语", nameEn: "Polish" },
  { code: "bs", nameZh: "波斯尼亚语", nameEn: "Bosnian" },
  { code: "fa", nameZh: "波斯语", nameEn: "Persian" },
  { code: "bho", nameZh: "博杰普尔语", nameEn: "Bhojpuri" },
  { code: "bew", nameZh: "Betawi", nameEn: "Betawi" },
  { code: "bua", nameZh: "布里亚特语", nameEn: "Buryat" },
  { code: "br", nameZh: "布列塔尼语", nameEn: "Breton" },
  { code: "bo", nameZh: "藏语", nameEn: "Tibetan" },
  { code: "chm", nameZh: "草原马里语", nameEn: "Meadow Mari" },
  { code: "ch", nameZh: "查莫罗语", nameEn: "Chamorro" },
  { code: "ce", nameZh: "车臣语", nameEn: "Chechen" },
  { code: "chk", nameZh: "楚克语", nameEn: "Chuukese" },
  { code: "cv", nameZh: "楚瓦什语", nameEn: "Chuvash" },
  { code: "tn", nameZh: "茨瓦纳语", nameEn: "Tswana" },
  { code: "ts", nameZh: "聪加语", nameEn: "Tsonga" },
  { code: "fa-AF", nameZh: "达里语", nameEn: "Dari" },
  { code: "tt", nameZh: "鞑靼语", nameEn: "Tatar" },
  { code: "da", nameZh: "丹麦语", nameEn: "Danish" },
  { code: "shn", nameZh: "掸语", nameEn: "Shan" },
  { code: "tet", nameZh: "德顿语", nameEn: "Tetum" },
  { code: "de", nameZh: "德语", nameEn: "German" },
  { code: "dv", nameZh: "迪维希语", nameEn: "Dhivehi" },
  { code: "dyu", nameZh: "迪尤拉语", nameEn: "Dyula" },
  { code: "tiv", nameZh: "蒂夫语", nameEn: "Tiv" },
  { code: "din", nameZh: "丁卡语", nameEn: "Dinka" },
  { code: "dje", nameZh: "敦贝语", nameEn: "Zarma" },
  { code: "doi", nameZh: "多格拉语", nameEn: "Dogri" },
  { code: "ru", nameZh: "俄语", nameEn: "Russian" },
  { code: "nd", nameZh: "恩道语", nameEn: "Northern Ndebele" },
  { code: "nqo", nameZh: "恩科语", nameEn: "N’Ko" },
  { code: "fo", nameZh: "法罗语", nameEn: "Faroese" },
  { code: "fr", nameZh: "法语", nameEn: "French" },
  { code: "zh-TW", nameZh: "繁体中文", nameEn: "Chinese (Traditional)" },
  { code: "sa", nameZh: "梵语", nameEn: "Sanskrit" },
  { code: "fil", nameZh: "菲律宾语", nameEn: "Filipino" },
  { code: "fj", nameZh: "斐济语", nameEn: "Fijian" },
  { code: "fi", nameZh: "芬兰语", nameEn: "Finnish" },
  { code: "fon", nameZh: "丰语", nameEn: "Fon" },
  { code: "fur", nameZh: "弗留利语", nameEn: "Friulian" },
  { code: "ff", nameZh: "富拉尼语", nameEn: "Fulah" },
  { code: "kg", nameZh: "刚果语", nameEn: "Kongo" },
  { code: "km", nameZh: "高棉语", nameEn: "Khmer" },
  { code: "kl", nameZh: "格陵兰语", nameEn: "Greenlandic" },
  { code: "ka", nameZh: "格鲁吉亚语", nameEn: "Georgian" },
  { code: "gu", nameZh: "古吉拉特语", nameEn: "Gujarati" },
  { code: "gn", nameZh: "瓜拉尼语", nameEn: "Guarani" },
  { code: "cnh", nameZh: "哈卡钦语", nameEn: "Hakha Chin" },
  { code: "kk", nameZh: "哈萨克语", nameEn: "Kazakh" },
  { code: "ht", nameZh: "海地克里奥尔语", nameEn: "Haitian Creole" },
  { code: "ko", nameZh: "韩语", nameEn: "Korean" },
  { code: "ha", nameZh: "豪萨语", nameEn: "Hausa" },
  { code: "nl", nameZh: "荷兰语", nameEn: "Dutch" },
  { code: "hrx", nameZh: "洪斯吕克语", nameEn: "Hunsrik" },
  { code: "ky", nameZh: "吉尔吉斯语", nameEn: "Kyrgyz" },
  { code: "rom", nameZh: "吉普赛语", nameEn: "Romani" },
  { code: "ktu", nameZh: "吉土巴语", nameEn: "Kituba" },
  { code: "gl", nameZh: "加利西亚语", nameEn: "Galician" },
  { code: "ca", nameZh: "加泰罗尼亚语", nameEn: "Catalan" },
  { code: "gaa", nameZh: "加族语", nameEn: "Ga" },
  { code: "zh-CN", nameZh: "简体中文", nameEn: "Chinese (Simplified)" },
  { code: "cs", nameZh: "捷克语", nameEn: "Czech" },
  { code: "kac", nameZh: "景颇语", nameEn: "Jingpo" },
  { code: "kn", nameZh: "卡纳达语", nameEn: "Kannada" },
  { code: "kr", nameZh: "卡努里语", nameEn: "Kanuri" },
  { code: "kha", nameZh: "卡西语", nameEn: "Khasi" },
  { code: "kek", nameZh: "凯克奇语", nameEn: "Qʼeqchiʼ" },
  { code: "kv", nameZh: "科米语", nameEn: "Komi" },
  { code: "xh", nameZh: "科萨语", nameEn: "Xhosa" },
  { code: "co", nameZh: "科西嘉语", nameEn: "Corsican" },
  { code: "crh", nameZh: "克里米亚鞑靼语", nameEn: "Crimean Tatar" },
  { code: "hr", nameZh: "克罗地亚语", nameEn: "Croatian" },
  { code: "kri", nameZh: "Krio", nameEn: "Krio" },
  { code: "qu", nameZh: "克丘亚语", nameEn: "Quechua" },
  { code: "gom", nameZh: "孔卡尼语", nameEn: "Konkani" },
  { code: "ku", nameZh: "库尔德语", nameEn: "Kurdish (Kurmanji)" },
  { code: "ckb", nameZh: "中库尔德语", nameEn: "Kurdish (Sorani)" },
  { code: "trp", nameZh: "廓博罗克语", nameEn: "Kokborok" },
  { code: "la", nameZh: "拉丁语", nameEn: "Latin" },
  { code: "ltg", nameZh: "Latgalian", nameEn: "Latgalian" },
  { code: "lv", nameZh: "拉脱维亚语", nameEn: "Latvian" },
  { code: "lo", nameZh: "老挝语", nameEn: "Lao" },
  { code: "lt", nameZh: "立陶宛语", nameEn: "Lithuanian" },
  { code: "lij", nameZh: "利古里亚语", nameEn: "Ligurian" },
  { code: "li", nameZh: "林堡语", nameEn: "Limburgish" },
  { code: "ln", nameZh: "林加拉语", nameEn: "Lingala" },
  { code: "rn", nameZh: "隆迪语", nameEn: "Rundi" },
  { code: "luo", nameZh: "卢奥语", nameEn: "Luo" },
  { code: "lg", nameZh: "卢干达语", nameEn: "Luganda" },
  { code: "lb", nameZh: "卢森堡语", nameEn: "Luxembourgish" },
  { code: "rw", nameZh: "卢旺达语", nameEn: "Kinyarwanda" },
  { code: "lmo", nameZh: "伦巴第语", nameEn: "Lombard" },
  { code: "ro", nameZh: "罗马尼亚语", nameEn: "Romanian" },
  { code: "mad", nameZh: "马都拉语", nameEn: "Madurese" },
  { code: "gv", nameZh: "马恩语", nameEn: "Manx" },
  { code: "mwr", nameZh: "马尔瓦里语", nameEn: "Marwari" },
  { code: "mt", nameZh: "马耳他语", nameEn: "Maltese" },
  { code: "mr", nameZh: "马拉地语", nameEn: "Marathi" },
  { code: "mg", nameZh: "马拉加斯语", nameEn: "Malagasy" },
  { code: "ml", nameZh: "马拉雅拉姆语", nameEn: "Malayalam" },
  { code: "ms", nameZh: "马来语", nameEn: "Malay" },
  { code: "ms-Arab", nameZh: "马来语（阿拉伯文）", nameEn: "Malay (Jawi)" },
  { code: "mk", nameZh: "马其顿语", nameEn: "Macedonian" },
  { code: "mh", nameZh: "马绍尔语", nameEn: "Marshallese" },
  { code: "mam", nameZh: "Mam", nameEn: "Mam" },
  { code: "mai", nameZh: "迈蒂利语", nameEn: "Maithili" },
  { code: "mni", nameZh: "曼尼普尔语（曼尼普尔文）", nameEn: "Meiteilon (Manipuri)" },
  { code: "mfe", nameZh: "毛里求斯克里奥尔语", nameEn: "Mauritian Creole" },
  { code: "mi", nameZh: "毛利语", nameEn: "Maori" },
  { code: "mn", nameZh: "蒙古语", nameEn: "Mongolian" },
  { code: "bn", nameZh: "孟加拉语", nameEn: "Bengali" },
  { code: "min", nameZh: "米南佳保语", nameEn: "Minangkabau" },
  { code: "lus", nameZh: "米佐语", nameEn: "Mizo" },
  { code: "my", nameZh: "缅甸语", nameEn: "Myanmar (Burmese)" },
  { code: "hmn", nameZh: "苗语", nameEn: "Hmong" },
  { code: "nhe", nameZh: "纳瓦特尔语（东瓦斯特卡）", nameEn: "Nahuatl (Eastern Huasteca)" },
  { code: "nr", nameZh: "南恩德贝勒语", nameEn: "Southern Ndebele" },
  { code: "af", nameZh: "南非荷兰语", nameEn: "Afrikaans" },
  { code: "st", nameZh: "南索托语", nameEn: "Southern Sotho" },
  { code: "new", nameZh: "尼泊尔巴萨语", nameEn: "Nepalbhasa (Newari)" },
  { code: "ne", nameZh: "尼泊尔语", nameEn: "Nepali" },
  { code: "nus", nameZh: "努埃尔语", nameEn: "Nuer" },
  { code: "no", nameZh: "挪威语", nameEn: "Norwegian" },
  { code: "pap", nameZh: "帕皮阿门托语", nameEn: "Papiamento" },
  { code: "pa", nameZh: "旁遮普语", nameEn: "Punjabi" },
  { code: "pa-Arab", nameZh: "旁遮普语（阿拉伯文）", nameEn: "Punjabi (Shahmukhi)" },
  { code: "pt", nameZh: "葡萄牙语", nameEn: "Portuguese" },
  { code: "pt-PT", nameZh: "葡萄牙语（葡萄牙）", nameEn: "Portuguese (Portugal)" },
  { code: "ps", nameZh: "普什图语", nameEn: "Pashto" },
  { code: "ny", nameZh: "齐切瓦语", nameEn: "Chichewa" },
  { code: "cgg", nameZh: "奇加语", nameEn: "Chiga" },
  { code: "ja", nameZh: "日语", nameEn: "Japanese" },
  { code: "sv", nameZh: "瑞典语", nameEn: "Swedish" },
  { code: "zap", nameZh: "萨波蒂克语", nameEn: "Zapotec" },
  { code: "sah", nameZh: "萨哈语", nameEn: "Yakut" },
  { code: "sm", nameZh: "萨摩亚语", nameEn: "Samoan" },
  { code: "sr", nameZh: "塞尔维亚语", nameEn: "Serbian" },
  { code: "crs", nameZh: "塞舌尔克里奥尔语", nameEn: "Seselwa Creole French" },
  { code: "sg", nameZh: "桑戈语", nameEn: "Sango" },
  { code: "sat", nameZh: "桑塔利语（拉丁文）", nameEn: "Santali" },
  { code: "si", nameZh: "僧伽罗语", nameEn: "Sinhala" },
  { code: "sn", nameZh: "绍纳语", nameEn: "Shona" },
  { code: "eo", nameZh: "世界语", nameEn: "Esperanto" },
  { code: "sk", nameZh: "斯洛伐克语", nameEn: "Slovak" },
  { code: "sl", nameZh: "斯洛文尼亚语", nameEn: "Slovenian" },
  { code: "ss", nameZh: "斯瓦蒂语", nameEn: "Swati" },
  { code: "sw", nameZh: "斯瓦希里语", nameEn: "Swahili" },
  { code: "gd", nameZh: "苏格兰盖尔语", nameEn: "Scots Gaelic" },
  { code: "sus", nameZh: "苏苏语", nameEn: "Susu" },
  { code: "ceb", nameZh: "宿务语", nameEn: "Cebuano" },
  { code: "so", nameZh: "索马里语", nameEn: "Somali" },
  { code: "tg", nameZh: "塔吉克语", nameEn: "Tajik" },
  { code: "tzm", nameZh: "塔马齐格特语", nameEn: "Tamazight" },
  { code: "zgh", nameZh: "塔马齐格特语（提非纳语）", nameEn: "Tamazight (Tifinagh)" },
  { code: "ty", nameZh: "塔希提语", nameEn: "Tahitian" },
  { code: "te", nameZh: "泰卢固语", nameEn: "Telugu" },
  { code: "ta", nameZh: "泰米尔语", nameEn: "Tamil" },
  { code: "th", nameZh: "泰语", nameEn: "Thai" },
  { code: "to", nameZh: "汤加语", nameEn: "Tongan" },
  { code: "ti", nameZh: "提格利尼亚语", nameEn: "Tigrinya" },
  { code: "tum", nameZh: "通布卡语", nameEn: "Tumbuka" },
  { code: "tyv", nameZh: "图瓦语", nameEn: "Tuvan" },
  { code: "tcy", nameZh: "Tulu", nameEn: "Tulu" },
  { code: "tr", nameZh: "土耳其语", nameEn: "Turkish" },
  { code: "tk", nameZh: "土库曼语", nameEn: "Turkmen" },
  { code: "tpi", nameZh: "托克皮辛语", nameEn: "Tok Pisin" },
  { code: "war", nameZh: "瓦瑞语", nameEn: "Waray" },
  { code: "mak", nameZh: "望加锡语", nameEn: "Makassar" },
  { code: "cy", nameZh: "威尔士语", nameEn: "Welsh" },
  { code: "vec", nameZh: "威尼斯语", nameEn: "Venetian" },
  { code: "ug", nameZh: "维吾尔语", nameEn: "Uyghur" },
  { code: "ve", nameZh: "文达语", nameEn: "Venda" },
  { code: "wo", nameZh: "沃洛夫语", nameEn: "Wolof" },
  { code: "udm", nameZh: "乌德穆尔特语", nameEn: "Udmurt" },
  { code: "ur", nameZh: "乌尔都语", nameEn: "Urdu" },
  { code: "uk", nameZh: "乌克兰语", nameEn: "Ukrainian" },
  { code: "uz", nameZh: "乌兹别克语", nameEn: "Uzbek" },
  { code: "es", nameZh: "西班牙语", nameEn: "Spanish" },
  { code: "fy", nameZh: "西弗里西亚语", nameEn: "Frisian" },
  { code: "szl", nameZh: "西里西亚语", nameEn: "Silesian" },
  { code: "scn", nameZh: "西西里语", nameEn: "Sicilian" },
  { code: "he", nameZh: "希伯来语", nameEn: "Hebrew" },
  { code: "el", nameZh: "希腊语", nameEn: "Greek" },
  { code: "hil", nameZh: "希利盖农语", nameEn: "Hiligaynon" },
  { code: "haw", nameZh: "夏威夷语", nameEn: "Hawaiian" },
  { code: "sd", nameZh: "信德语", nameEn: "Sindhi" },
  { code: "hu", nameZh: "匈牙利语", nameEn: "Hungarian" },
  { code: "su", nameZh: "巽他语", nameEn: "Sundanese" },
  { code: "jam", nameZh: "牙买加土语", nameEn: "Jamaican Patois" },
  { code: "hy", nameZh: "亚美尼亚语", nameEn: "Armenian" },
  { code: "ace", nameZh: "亚齐语", nameEn: "Acehnese" },
  { code: "iba", nameZh: "伊班语", nameEn: "Iban" },
  { code: "ig", nameZh: "伊博语", nameEn: "Igbo" },
  { code: "ilo", nameZh: "伊洛卡诺语", nameEn: "Ilocano" },
  { code: "it", nameZh: "意大利语", nameEn: "Italian" },
  { code: "yi", nameZh: "意第绪语", nameEn: "Yiddish" },
  { code: "hi", nameZh: "印地语", nameEn: "Hindi" },
  { code: "id", nameZh: "印度尼西亚语", nameEn: "Indonesian" },
  { code: "en", nameZh: "英语", nameEn: "English" },
  { code: "en-US", nameZh: "英语（美国）", nameEn: "English (US)" },
  { code: "yua", nameZh: "尤卡坦玛雅语", nameEn: "Yucatec Maya" },
  { code: "yo", nameZh: "约鲁巴语", nameEn: "Yoruba" },
  { code: "yue", nameZh: "粤语", nameEn: "Cantonese" },
  { code: "vi", nameZh: "越南语", nameEn: "Vietnamese" },
  { code: "jv", nameZh: "爪哇语", nameEn: "Javanese" },
  { code: "dz", nameZh: "宗卡语", nameEn: "Dzongkha" },
  { code: "zu", nameZh: "祖鲁语", nameEn: "Zulu" },
];

const byCode = new Map(APP_LANGUAGES.map((l) => [l.code, l]));

export function getLanguage(code: string): AppLanguage | undefined {
  return byCode.get(code);
}

/** Fallback labels (catalog defaults). Prefer `localizedLanguageName` for UI. */
export function languageLabel(
  code: string,
  display: "zh" | "en" | "both" = "zh",
): string {
  const lang = byCode.get(code);
  if (!lang) return code;
  if (display === "en") return lang.nameEn;
  if (display === "both") return `${lang.nameZh} · ${lang.nameEn}`;
  return lang.nameZh;
}

/**
 * Deterministic label from catalog (same on server + client).
 * Use for SSR / first paint to avoid Intl ICU mismatches.
 */
export function stableLanguageName(code: string, uiLocale: string): string {
  const lang = byCode.get(code);
  if (!lang) return code;
  if ((uiLocale || "en").toLowerCase().startsWith("zh")) return lang.nameZh;
  return lang.nameEn;
}

/**
 * Language name in the current UI locale via Intl.DisplayNames.
 * Node and browsers may disagree — only use after client mount.
 */
export function localizedLanguageName(code: string, uiLocale: string): string {
  const tag = uiLocale || "en";
  try {
    const dn = new Intl.DisplayNames([tag, "en"], { type: "language" });
    const name = dn.of(code);
    if (name && name.toLowerCase() !== code.toLowerCase()) return name;
  } catch {
    /* unsupported locale / code */
  }
  return stableLanguageName(code, tag);
}

/** Codes that already have built-in next-intl message packs. */
export const BUILTIN_MESSAGE_CODES = ["zh-CN", "en-US"] as const;

/**
 * Prefer common targets at the top of selects; rest sorted by localized name.
 */
export const POPULAR_LANGUAGE_CODES = [
  "zh-CN",
  "zh-TW",
  "en",
  "ja",
  "ko",
  "ru",
  "fr",
  "de",
  "es",
  "pt",
  "it",
  "ar",
  "hi",
  "th",
  "vi",
  "id",
  "tr",
] as const;

export function languagesForSelect(
  uiLocale = "zh-CN",
  /** Use Intl names when sorting (client-only). */
  preferIntl = false,
): AppLanguage[] {
  const label = preferIntl ? localizedLanguageName : stableLanguageName;
  const popular = new Set<string>(POPULAR_LANGUAGE_CODES);
  const head = POPULAR_LANGUAGE_CODES.map((c) => byCode.get(c)).filter(
    (l): l is AppLanguage => Boolean(l),
  );
  const rest = APP_LANGUAGES.filter((l) => !popular.has(l.code)).sort((a, b) =>
    label(a.code, uiLocale).localeCompare(label(b.code, uiLocale), uiLocale),
  );
  return [...head, ...rest];
}
