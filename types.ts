export enum TranslationMode {
  TEXT = 'TEXT',
  PDF = 'PDF'
}

export enum SourceLanguage {
  ENGLISH = 'English',
  MANGLISH = 'Manglish'
}

export interface TranslationState {
  inputText: string;
  pdfFile: File | null;
  pdfBase64: string | null;
  outputText: string;
  isLoading: boolean;
  error: string | null;
}