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
  Menu,
  X,
  Info,
} from "lucide-react";

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);

  // UI States for Mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDriveLinks, setShowDriveLinks] = useState(true); // Default open inside drawer

  // Initialize API Key and Check Selection
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      } else {
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

    // Close sidebar on mobile when sending message if it was open
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

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
      if (error.message === "INVALID_API_KEY" && (window as any).aistudio) {
        setIsKeySelected(false);
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

  // --- Render Key Setup Screen ---
  if (!isKeySelected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6">
        <div className="bg-white p-6 rounded-3xl shadow-xl max-w-sm w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Key className="text-teal-600" size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            Selamat Datang
          </h1>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Untuk memulai konsultasi dengan <b>SiSekretariat</b>, silakan
            hubungkan API Key Anda.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-slate-900 text-white font-medium py-3.5 px-4 rounded-xl active:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
          >
            <Key size={18} />
            Hubungkan API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden relative">
      {/* --- Mobile Header --- */}
      <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-4 shadow-md z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu size={24} className="text-white" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-bold text-base leading-tight">SiSekretariat</h1>
            <span className="text-[10px] text-teal-400 font-medium tracking-wide">
              DKK SAMARINDA
            </span>
          </div>
        </div>
      </header>

      {/* --- Overlay (Background Dimmer) --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- Slide-out Drawer (Menu) --- */}
      <div
        className={`fixed inset-y-0 left-0 w-[85%] max-w-[300px] bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-lg flex items-center gap-2">
            <ShieldCheck className="text-teal-400" size={20} />
            Menu
          </span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 bg-slate-800 rounded-full text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-slate-800/50 rounded-2xl p-4 mb-4 border border-slate-700/50">
            <div
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => setShowDriveLinks(!showDriveLinks)}
            >
              <h3 className="text-sm font-semibold text-teal-400 flex items-center gap-2">
                <FileText size={16} />
                Knowledge Base
              </h3>
              <ChevronRight
                size={16}
                className={`text-slate-500 transition-transform ${
                  showDriveLinks ? "rotate-90" : ""
                }`}
              />
            </div>

            <p className="text-xs text-slate-400 mb-4 font-light">
              Akses & Unduh dokumen resmi untuk dianalisis oleh AI:
            </p>

            {showDriveLinks && (
              <div className="space-y-2.5 animate-fadeIn">
                {[
                  {
                    label: "Folder Dokumen KP",
                    url: "https://drive.google.com/drive/folders/1uyU5fakd_SaNS7gcrM56H8cM9EE79dZ4",
                  },
                  {
                    label: "File Spesifik KP (PDF)",
                    url: "https://drive.google.com/file/d/1m1hUc9wsqoXjT_WlmcvjAcbeh5YRATay/view",
                  },
                  {
                    label: "Alur Permohonan PPID",
                    url: "https://dinkes.samarindakota.go.id/ppid-tatacarapermohonan",
                  },
                  {
                    label: "Tutorial SiCepat-ASN (Youtube)",
                    url: "https://www.youtube.com/watch?v=L5jjNTvNIbQ",
                  },
                ].map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-700 active:bg-slate-800 active:scale-[0.98] transition-all group"
                  >
                    <div className="bg-slate-800 p-1.5 rounded-lg group-hover:bg-teal-900/30 transition-colors">
                      <ExternalLink size={14} className="text-teal-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-200 line-clamp-2">
                      {link.label}
                    </span>
                  </a>
                ))}

                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl flex gap-2">
                  <Info
                    size={16}
                    className="text-yellow-500 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-[10px] text-yellow-200/80 leading-snug">
                    Tips: Download PDF dari link di atas, lalu upload ke chat
                    agar AI bisa membaca isinya.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-[10px] text-center text-slate-600">
            © 2025 Dinas Kesehatan Kota Samarinda
          </p>
        </div>
      </div>

      {/* --- Main Chat Area --- */}
      <main className="flex-1 overflow-hidden relative w-full flex flex-col bg-slate-50">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onSuggestionClick={(text) => handleSend(text, [])}
        />

        {/* Input Wrapper ensures it stays at bottom */}
        <div className="w-full bg-white border-t border-slate-100 pb-safe">
          <ChatInput
            onSend={handleSend}
            disabled={isLoading || !isKeySelected}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
