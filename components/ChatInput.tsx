import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Attachment } from '../types';
import { fileToBase64 } from '../services/utils';

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if ((text.trim() || attachments.length > 0) && !disabled && !isProcessingFile) {
      onSend(text, attachments);
      setText('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFile(true);
    const newAttachments: Attachment[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Limit file size (e.g., 20MB)
        if (file.size > 20 * 1024 * 1024) {
          alert(`File ${file.name} terlalu besar (Max 20MB)`);
          continue;
        }
        
        const base64 = await fileToBase64(file);
        newAttachments.push({
          name: file.name,
          type: file.type,
          data: base64
        });
      }
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
      console.error("File upload error:", error);
      alert("Gagal memproses file.");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
    setText(target.value);
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 min-w-[150px] max-w-[250px]">
              <div className="p-1.5 bg-white rounded-full shadow-sm">
                {att.type.includes('image') ? <ImageIcon size={16} className="text-teal-600" /> : <FileText size={16} className="text-teal-600" />}
              </div>
              <span className="text-xs text-slate-700 truncate font-medium flex-1">{att.name}</span>
              <button 
                onClick={() => removeAttachment(idx)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all shadow-sm">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.txt,image/*"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessingFile}
          className={`p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors ${isProcessingFile ? 'animate-pulse' : ''}`}
          title="Lampirkan Dokumen (PDF/Gambar)"
        >
          {isProcessingFile ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder={attachments.length > 0 ? "Tambahkan pesan..." : "Tanyakan tentang kenaikan pangkat..."}
          disabled={disabled}
          className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-slate-800 placeholder:text-slate-400 py-2 max-h-[150px] text-sm sm:text-base"
          rows={1}
        />

        <button
          onClick={handleSend}
          disabled={(!text.trim() && attachments.length === 0) || disabled}
          className={`p-2 rounded-full transition-all duration-200 ${
            (!text.trim() && attachments.length === 0) || disabled
              ? 'bg-slate-200 text-slate-400'
              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md'
          }`}
        >
          <Send size={20} className={(!text.trim() && attachments.length === 0) || disabled ? '' : 'ml-0.5'} />
        </button>
      </div>
      <p className="text-[10px] text-slate-400 mt-2 text-center">
        AI dapat membuat kesalahan. Periksa kembali informasi dengan dokumen resmi.
      </p>
    </div>
  );
};

export default ChatInput;