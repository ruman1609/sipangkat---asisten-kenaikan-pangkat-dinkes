import React, { useState, useEffect } from "react";
import { Message, Role, Attachment } from "./types";
import { GeminiService } from "./services/gemini";
import { generateId } from "./services/utils";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import {
  Activity,
  Key,
  ShieldCheck,
  ChevronRight,
  FileText,
  ExternalLink,
} from "lucide-react";

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDriveLinks, setShowDriveLinks] = useState(false);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);

  // Initialize API Key and Check Selection
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      } else {
        // Fallback for environments without aistudio wrapper
        setIsKeySelected(!!process.env.API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        // Assume success and check/set state
        setIsKeySelected(true);
      } catch (error) {
        console.error("Error selecting API key:", error);
      }
    }
  };

  const handleSend = async (text: string, attachments: Attachment[]) => {
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: Role.MODEL,
          text: "Kunci API (API Key) tidak ditemukan. Mohon pastikan Anda telah memilih API Key.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
      return;
    }

    const newMessage: Message = {
      id: generateId(),
      role: Role.USER,
      text,
      attachments,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const gemini = new GeminiService();
      const responseText = await gemini.sendMessage(
        messages,
        text,
        attachments
      );

      const botMessage: Message = {
        id: generateId(),
        role: Role.MODEL,
        text: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      // Handle Invalid API Key or Project Not Found specifically
      if (error.message === "INVALID_API_KEY" && (window as any).aistudio) {
        setIsKeySelected(false);
        // Do not add error message to chat, just reset UI to key selection
        return;
      }

      const errorMessage: Message = {
        id: generateId(),
        role: Role.MODEL,
        text: error.message || "Maaf, terjadi kesalahan teknis.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isKeySelected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="text-teal-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Setup API Key
          </h1>
          <p className="text-slate-600 mb-6 text-sm">
            Untuk menggunakan SiPangkat, silakan pilih atau masukkan Google
            Cloud API Key Anda dari project berbayar.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-teal-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-teal-700 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <Key size={18} />
            Pilih API Key
          </button>
          <p className="text-xs text-slate-400 mt-4">
            <a
              href="https://ai.google.dev/gemini-api/docs/billing"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-teal-600"
            >
              Informasi Billing & API Key
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white md:flex-row">
      {/* Sidebar (Desktop) / Header (Mobile) */}
      <div className="bg-slate-900 text-white md:w-80 flex-shrink-0 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-teal-500 p-2 rounded-lg">
            <Activity size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">SiPangkat</h1>
            <p className="text-xs text-slate-400">Dinkes Kota Samarinda</p>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
            <h3 className="text-sm font-semibold text-teal-400 mb-2 flex items-center gap-2">
              <ShieldCheck size={16} />
              Knowledge Base
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Akses dokumen resmi (PDF) di Google Drive untuk informasi detail:
            </p>
            <button
              onClick={() => setShowDriveLinks(!showDriveLinks)}
              className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-between group"
            >
              <span>{showDriveLinks ? "Tutup Link" : "Buka Link Dokumen"}</span>
              <ChevronRight
                size={14}
                className={`transition-transform ${
                  showDriveLinks ? "rotate-90" : ""
                }`}
              />
            </button>

            {showDriveLinks && (
              <div className="mt-3 space-y-2 text-xs animate-fadeIn">
                <a
                  href="https://drive.google.com/drive/folders/1uyU5fakd_SaNS7gcrM56H8cM9EE79dZ4"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-2 rounded bg-slate-800 hover:text-teal-300 transition-colors border border-slate-700"
                >
                  <FileText size={14} />
                  <span>1. Folder Dokumen KP</span>
                  <ExternalLink size={10} className="ml-auto opacity-50" />
                </a>
                <a
                  href="https://drive.google.com/file/d/1m1hUc9wsqoXjT_WlmcvjAcbeh5YRATay/view"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-2 rounded bg-slate-800 hover:text-teal-300 transition-colors border border-slate-700"
                >
                  <FileText size={14} />
                  <span>2. File Spesifik</span>
                  <ExternalLink size={10} className="ml-auto opacity-50" />
                </a>
                <p className="text-[10px] text-yellow-500 mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                  *Download PDF dari link di atas dan upload ke chat agar AI
                  bisa membacanya.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500">
            © 2025 BKPSDM & Dinkes Samarinda
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-teal-400" />
            <span className="font-bold">SiPangkat</span>
          </div>
          <button
            onClick={() => setShowDriveLinks(!showDriveLinks)}
            className="text-slate-300"
          >
            <FileText size={20} />
          </button>
        </header>

        {/* Mobile Drive Links Overlay */}
        {showDriveLinks && (
          <div className="md:hidden absolute top-14 left-0 w-full bg-slate-800 text-white p-4 z-20 shadow-xl border-b border-slate-700">
            <p className="text-xs font-bold mb-2">Link Referensi:</p>
            <a
              href="https://drive.google.com/drive/folders/1uyU5fakd_SaNS7gcrM56H8cM9EE79dZ4"
              target="_blank"
              rel="noreferrer"
              className="block text-sm text-teal-400 mb-2 hover:underline"
            >
              1. Folder Dokumen KP
            </a>
            <a
              href="https://drive.google.com/file/d/1m1hUc9wsqoXjT_WlmcvjAcbeh5YRATay/view"
              target="_blank"
              rel="noreferrer"
              className="block text-sm text-teal-400 hover:underline"
            >
              2. File Spesifik
            </a>
          </div>
        )}

        <MessageList
          messages={messages}
          isLoading={isLoading}
          onSuggestionClick={(text) => handleSend(text, [])}
        />

        <ChatInput onSend={handleSend} disabled={isLoading || !isKeySelected} />
      </div>
    </div>
  );
};

export default App;
