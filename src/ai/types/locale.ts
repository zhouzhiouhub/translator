/** Phase 2: dynamic locale pack generation */
export interface LocaleParams {
  sourceLocale: string;
  targetLocale: string;
  sourceMessages: Record<string, unknown>;
  referenceMessages?: Record<string, unknown>;
  glossary?: Record<string, string>;
  promptVersion: string;
}

export interface LocaleResult {
  locale: string;
  messages: Record<string, unknown>;
  warnings: string[];
  failedKeys: string[];
}
