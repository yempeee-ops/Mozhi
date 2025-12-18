import React, { useState, useCallback } from 'react';
import { 
  ArrowRight, 
  Languages, 
  FileText, 
  Type, 
  Sparkles, 
  UploadCloud,
  X,
  Copy,
  Check,
  RotateCcw,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import AuroraBackground from './components/Layout/AuroraBackground';
import GlassContainer from './components/Layout/GlassContainer';
import Button from './components/UI/Button';
import { TranslationMode, SourceLanguage } from './types';
import { translateText, translatePdf } from './services/geminiService';

const MAX_CHAR_LIMIT = 10000;

const App: React.FC = () => {
  const [mode, setMode] = useState<TranslationMode>(TranslationMode.TEXT);
  const [sourceLang, setSourceLang] = useState<SourceLanguage>(SourceLanguage.ENGLISH);
  const [inputText, setInputText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    setError(null);
    setIsLoading(true);
    setOutputText(''); // Clear previous result

    try {
      let result = '';
      if (mode === TranslationMode.TEXT) {
        if (!inputText.trim()) {
            throw new Error("Please enter some text to translate.");
        }
        result = await translateText(inputText, sourceLang);
      } else {
        if (!pdfFile) {
            throw new Error("Please upload a PDF file.");
        }
        // Pass the file object directly; the service handles extraction or base64 conversion
        result = await translatePdf(pdfFile, sourceLang);
      }
      setOutputText(result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setError("Only PDF files are supported.");
        return;
      }
      setPdfFile(file);
      setError(null);
    }
  };

  const clearFile = () => {
    setPdfFile(null);
    setError(null);
  };

  const resetApp = () => {
    setInputText('');
    setPdfFile(null);
    setOutputText('');
    setError(null);
    setIsCopied(false);
  };

  const copyToClipboard = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!outputText) return;
    setIsDownloading(true);

    try {
      const element = document.createElement('div');
      
      element.innerHTML = `
        <div style="font-family: 'Noto Sans Malayalam', sans-serif; color: #000; padding: 40px; background: #fff; width: 595px; min-height: 842px;">
          <h1 style="color: #6b21a8; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px; margin-bottom: 20px; font-size: 24px;">Mozhi Translation</h1>
          <div style="font-size: 14px; color: #666; margin-bottom: 30px;">
            Source: ${sourceLang} | Date: ${new Date().toLocaleDateString()}
          </div>
          <div style="font-size: 16px; line-height: 1.8; white-space: pre-wrap;">${outputText}</div>
        </div>
      `;
      
      element.style.position = 'fixed';
      element.style.left = '-9999px';
      element.style.top = '-9999px';
      document.body.appendChild(element);

      const canvas = await html2canvas(element.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`mozhi-translation-${Date.now()}.pdf`);

      document.body.removeChild(element);
    } catch (e) {
      console.error("PDF generation failed", e);
      setError("Failed to generate PDF. Please try copying the text instead.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen relative font-sans text-gray-100 selection:bg-purple-500/30">
      <AuroraBackground />

      <main className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl">
        
        {/* Header */}
        <header className="text-center mb-10 lg:mb-16 relative">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-4 shadow-2xl shadow-purple-900/50">
            <Sparkles className="w-6 h-6 text-fuchsia-400 mr-2" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-200 to-indigo-200 tracking-tight">
              Mozhi
            </h1>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-lg">
            Casual <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Malayalam</span> Translator
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Convert English or Manglish into natural, everyday Malayalam. 
            Perfect for chats, captions, and informal documents.
          </p>
        </header>

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Toggle Mode */}
            <GlassContainer className="p-1 flex rounded-xl justify-center sm:justify-start">
              <button
                onClick={() => setMode(TranslationMode.TEXT)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === TranslationMode.TEXT 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Type className="w-4 h-4 mr-2" />
                Text
              </button>
              <button
                onClick={() => setMode(TranslationMode.PDF)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === TranslationMode.PDF 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF Document
              </button>
            </GlassContainer>

            {/* Source Language */}
            <GlassContainer className="px-4 py-2 flex items-center justify-center gap-3">
               <span className="text-sm text-white/50 uppercase tracking-wider font-semibold text-[10px]">From</span>
               <div className="flex gap-2">
                  <button 
                    onClick={() => setSourceLang(SourceLanguage.ENGLISH)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${sourceLang === SourceLanguage.ENGLISH ? 'text-white font-medium bg-white/10' : 'text-white/50 hover:text-white'}`}
                  >
                    English
                  </button>
                  <div className="w-px bg-white/10 h-6 self-center mx-1"></div>
                  <button 
                     onClick={() => setSourceLang(SourceLanguage.MANGLISH)}
                     className={`px-3 py-1 rounded text-sm transition-colors ${sourceLang === SourceLanguage.MANGLISH ? 'text-white font-medium bg-white/10' : 'text-white/50 hover:text-white'}`}
                  >
                    Manglish
                  </button>
               </div>
            </GlassContainer>
          </div>

          {/* Restart Button */}
          <GlassContainer className="hidden md:block">
            <button
              onClick={resetApp}
              className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Start Over"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </GlassContainer>
          
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          
          {/* Input Section */}
          <GlassContainer className="flex flex-col h-[500px] overflow-hidden group border-white/10 hover:border-white/20 transition-colors relative">
             {/* Mobile Restart Button */}
             <div className="absolute top-4 right-4 z-20 md:hidden">
                <button
                  onClick={resetApp}
                  className="p-2 bg-white/5 border border-white/10 backdrop-blur-md rounded-lg text-white/70 hover:text-white"
                  title="Start Over"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
             </div>

            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
              <span className="text-sm font-medium text-white/70 flex items-center gap-2">
                 <Languages className="w-4 h-4 text-purple-400" /> 
                 Input ({sourceLang})
              </span>
              {mode === TranslationMode.TEXT && (
                <span className={`text-xs mr-8 md:mr-0 transition-colors ${inputText.length > MAX_CHAR_LIMIT * 0.9 ? 'text-orange-400' : 'text-white/30'}`}>
                  {inputText.length.toLocaleString()} / {MAX_CHAR_LIMIT.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex-1 relative">
              {mode === TranslationMode.TEXT ? (
                <textarea
                  className="w-full h-full bg-transparent p-6 resize-none focus:outline-none placeholder:text-white/20 text-lg leading-relaxed custom-scrollbar overflow-y-auto"
                  placeholder={sourceLang === SourceLanguage.ENGLISH ? "Type or paste your English text here..." : "Type your Manglish here (e.g., 'Innathe visheshangal entha?')..."}
                  value={inputText}
                  maxLength={MAX_CHAR_LIMIT}
                  onChange={(e) => setInputText(e.target.value)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center relative">
                   {!pdfFile ? (
                     <>
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                           <UploadCloud className="w-10 h-10 text-purple-400 opacity-80" />
                        </div>
                        <p className="text-lg font-medium text-white/90 mb-2">Upload your PDF</p>
                        <p className="text-sm text-white/50 mb-6 max-w-xs">Drag and drop or click to browse files to translate.</p>
                        <label className="cursor-pointer">
                          <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
                          <span className="px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium border border-white/10">
                            Choose File
                          </span>
                        </label>
                     </>
                   ) : (
                     <div className="w-full max-w-xs p-6 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <FileText className="w-12 h-12 text-fuchsia-400 mb-4" />
                        <p className="text-sm font-medium text-white/90 truncate w-full text-center mb-1">{pdfFile.name}</p>
                        <p className="text-xs text-white/40 mb-4">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button 
                          onClick={clearFile}
                          className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-md hover:bg-red-500/10"
                        >
                          <X className="w-3 h-3" /> Remove
                        </button>
                     </div>
                   )}
                </div>
              )}
            </div>
            
            {/* Translate Button */}
            <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end relative z-10">
              <Button 
                onClick={handleTranslate} 
                isLoading={isLoading} 
                className="w-full sm:w-auto"
                disabled={mode === TranslationMode.TEXT ? !inputText.trim() : !pdfFile}
              >
                <span>Translate to Malayalam</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </GlassContainer>

          {/* Output Section */}
          <GlassContainer className="flex flex-col h-[500px] overflow-hidden border-white/10">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-purple-900/20">
              <span className="text-sm font-medium text-fuchsia-300 flex items-center gap-2">
                 <Sparkles className="w-4 h-4" /> 
                 Casual Malayalam
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={handleDownloadPdf} 
                  disabled={!outputText || isDownloading}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-30"
                  title="Download as PDF"
                >
                  {isDownloading ? <span className="w-4 h-4 block border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Download className="w-4 h-4" />}
                </button>
                <div className="w-px h-4 bg-white/10 self-center"></div>
                <button 
                  onClick={copyToClipboard} 
                  disabled={!outputText}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-30"
                  title="Copy to clipboard"
                >
                  {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 relative overflow-y-auto custom-scrollbar">
              {error ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-400">
                    <X className="w-6 h-6" />
                  </div>
                  <p className="text-red-200 font-medium mb-1">Translation Failed</p>
                  <p className="text-red-200/50 text-sm max-w-xs">{error}</p>
                </div>
              ) : outputText ? (
                <div className="prose prose-invert max-w-none">
                  <p className="font-malayalam text-lg lg:text-xl leading-relaxed whitespace-pre-wrap text-purple-50 animate-in fade-in duration-500">
                    {outputText}
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/20 select-none">
                   <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-4">
                      <Languages className="w-8 h-8 opacity-50" />
                   </div>
                   <p className="text-sm">Translation will appear here</p>
                </div>
              )}
              
              {/* Decorative Glow */}
              {outputText && (
                 <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />
              )}
            </div>
          </GlassContainer>

        </div>
      </main>
    </div>
  );
};

export default App;