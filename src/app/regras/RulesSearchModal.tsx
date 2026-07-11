"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlass, FileText, ArrowRight } from "@phosphor-icons/react";
import rulesData from "./rules.json";

interface RulesSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (ruleId: string) => void;
  allLinks: Array<{id: string, label: string, icon: any}>;
}

export function RulesSearchModal({ isOpen, onClose, onSelect, allLinks }: RulesSearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Em vez de chamar open aqui (pois o estado open pode estar em page.tsx),
          // disparamos um evento customizado ou passamos uma forma de gerenciar
          // Para simplificar, o escutador global fica em page.tsx
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Strip HTML to make search text clean
  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const results = query.length >= 2 ? rulesData.sections.filter(section => {
    const textToSearch = (section.title + " " + stripHtml(section.html || "")).toLowerCase();
    return textToSearch.includes(query.toLowerCase());
  }).map(section => {
    const link = allLinks.find(l => l.id === section.id);
    return {
      ...section,
      label: link ? link.label : section.title
    };
  }) : [];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
        {/* BACKDROP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* MODAL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* SEARCH HEADER */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <MagnifyingGlass size={24} className="text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Pesquisar nas regras..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-zinc-500"
            />
            <div className="flex gap-1 text-[10px] font-bold text-zinc-500">
              <kbd className="px-2 py-1 rounded bg-white/5 border border-white/10">ESC</kbd>
            </div>
          </div>

          {/* RESULTS */}
          <div className="overflow-y-auto p-2 flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
            {query.length > 0 && query.length < 2 && (
              <div className="p-8 text-center text-zinc-500">
                Digite pelo menos 2 caracteres para pesquisar...
              </div>
            )}
            
            {query.length >= 2 && results.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                Nenhum resultado encontrado para "{query}"
              </div>
            )}
            
            {query.length >= 2 && results.length > 0 && (
              <div className="flex flex-col gap-1">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      onSelect(result.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="flex flex-col">
                      <span className="text-white font-medium flex items-center gap-2">
                        <FileText size={16} className="text-[var(--color-detroit-red)]" />
                        {result.label}
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            )}
            
            {query.length === 0 && (
              <div className="p-8 text-center flex flex-col items-center gap-3 opacity-50">
                <MagnifyingGlass size={48} className="text-zinc-600" />
                <p className="text-sm text-zinc-500">
                  Pesquise por "VDM", "Assalto", "Polícia", etc.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
