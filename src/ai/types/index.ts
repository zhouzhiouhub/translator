import type { TranslateParams, TranslateResult } from "./translate";
import type { LocaleParams, LocaleResult } from "./locale";

export interface AIProvider {
  readonly id: string;
  testConnection(): Promise<boolean>;
  translate(params: TranslateParams): Promise<TranslateResult>;
  generateLocale?(params: LocaleParams): Promise<LocaleResult>;
}

export type { TranslateParams, TranslateResult, LocaleParams, LocaleResult };
