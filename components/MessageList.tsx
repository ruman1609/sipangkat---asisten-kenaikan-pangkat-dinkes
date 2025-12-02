import React, { useEffect, useRef } from 'react';
import { Message, Role } from '../types';
import { Bot, User, FileText, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSuggestionClick: (text: string) => void;
}

const SUGGESTIONS = [
  "Apa syarat Kenaikan Pangkat Reguler?",
  "Bagaimana alur pengajuan berkas di Dinkes?",
  "Apa bedanya KP Pilihan dan KP Reguler?",
  "Dokumen apa saja yang wajib diupload ke SIASN?",
  "Kapan batas akhir pengumpulan berkas?"
];

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onSuggestionClick }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 sm:p-6 bg-slate-50">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-6 opacity-90 mt-4">
          <div className="flex flex-col items-center max-w-lg">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center shadow-inner mb-4">
              <Bot size={40} className="text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Halo, saya SiPangkat!</h2>
            <p className="mt-2 text-sm text-slate-600 max-w-sm">
              Asisten virtual kepegawaian Dinas Kesehatan Kota Samarinda.
            </p>
          </div>

          <div className="grid gap-2 w-full max-w-md">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 text-left">Pertanyaan Populer</p>
            {SUGGESTIONS.map((text, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick(text)}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-400 hover:shadow-md transition-all group text-left"
              >
                <span className="text-sm text-slate-700 group-hover:text-teal-700">{text}</span>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
              </button>
            ))}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-left max-w-md">
            <p className="font-semibold text-blue-800 mb-1 flex items-center gap-2">
              <FileText size={14} /> Tips Analisis Dokumen:
            </p>
            <p className="text-blue-700 leading-relaxed">
              Untuk hasil terbaik, unduh <strong>PDF Regulasi / Surat Edaran</strong> dari menu samping, lalu upload di sini. Saya akan membaca isinya untuk Anda.
            </p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 sm:gap-4 ${
            msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm ${
            msg.role === Role.USER ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'
          }`}>
            {msg.role === Role.USER ? <User size={18} /> : <Bot size={20} />}
          </div>

          {/* Message Content */}
          <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}>
            
            {/* Attachments Display */}
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 justify-end">
                {msg.attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs bg-white border border-slate-200 p-2 rounded-md shadow-sm">
                    <FileText size={14} className="text-teal-500" />
                    <span className="truncate max-w-[150px] text-slate-600">{att.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bubble */}
            <div
              className={`px-4 py-3 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed ${
                msg.role === Role.USER
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              } ${msg.isError ? 'border-red-300 bg-red-50 text-red-800' : ''}`}
            >
              {msg.isError ? (
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{msg.text}</span>
                </div>
              ) : (
                <div className={`markdown-body ${msg.role === Role.USER ? 'text-white' : 'text-slate-800'}`}>
                  <ReactMarkdown
                    components={{
                      ul: ({node, ...props}) => <ul className="list-disc ml-4 space-y-1 my-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-4 space-y-1 my-2" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-lg font-bold my-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-bold my-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-bold my-1" {...props} />,
                      a: ({node, ...props}) => <a className="text-teal-500 underline hover:text-teal-600" target="_blank" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            
            {/* Timestamp */}
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {msg.role === Role.MODEL ? 'SiPangkat • ' : 'Anda • '}
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center animate-pulse">
            <Bot size={20} className="text-teal-600 opacity-50" />
          </div>
          <div className="flex items-center space-x-2 bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;