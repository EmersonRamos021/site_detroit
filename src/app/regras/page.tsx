"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Shield, BookOpen, HandFist, WarningCircle, Gavel, FileText, 
  MapPin, Users, Target, LockKey, CurrencyCircleDollar, Buildings, Crosshair,
  Fire, ArrowSquareOut, Wheelchair, Heart, UsersThree, CarProfile, Skull, DoorOpen, ArrowsClockwise, PoliceCar, Knife, XCircle, Trash, CaretDown, Ghost,
  Handshake, ListChecks, MagnifyingGlass
} from "@phosphor-icons/react";
import { useState, useEffect, useMemo, useRef } from "react";

interface RuleSection {
  id: string;
  title: string;
  html: string;
}

interface RulesData {
  title: string;
  sections: RuleSection[];
}

// Hardcoded Sidebar Structure exactly as the GitBook screenshots
const sidebarGroups = [
  {
    title: "INÍCIO",
    icon: Globe,
    links: [
      { id: "apresentacao", label: "Apresentação", icon: Handshake },
      { id: "diretrizes-essenciais", label: "Diretrizes Essenciais", icon: ListChecks },
      { 
        id: "regras-basicas", label: "Regras Básicas", icon: BookOpen,
        subLinks: [
          { id: "flaming", label: "Flaming", icon: Fire },
          { id: "out-of-character-ooc", label: "OOC", icon: ArrowSquareOut },
          { id: "power-gaming-pg", label: "Power Gaming (PG)", icon: Wheelchair },
          { id: "amor-a-vida-sav", label: "Amor à Vida (SAV)", icon: Heart },
          { id: "forcar-rp", label: "Forçar RP", icon: UsersThree },
          { id: "vehicle-dathmatch-vdm", label: "VDM", icon: CarProfile },
          { id: "random-deathmatch-rdm", label: "RDM", icon: Skull },
          { id: "combat-logging-cl", label: "Combat Logging (CL)", icon: DoorOpen },
          { id: "duplo-rp", label: "Duplo RP", icon: ArrowsClockwise },
          { id: "cop-bait", label: "Cop Bait", icon: PoliceCar },
          { id: "revenge-kill", label: "Revenge Kill", icon: Knife },
          { id: "dark-rp", label: "Dark RP", icon: Ghost },
          { id: "anti-rp", label: "Anti RP", icon: XCircle },
          { id: "trash-rp", label: "Trash RP", icon: Trash },
          { id: "meta-gaming", label: "Meta Gaming", icon: WarningCircle },
        ]
      },
      { 
        id: "areas-civis", label: "Áreas Civis", icon: Shield,
        subLinks: [
          { id: "condutas", label: "Condutas", icon: WarningCircle },
        ]
      },
    ]
  },
  {
    title: "ORGANIZAÇÕES ILEGAIS",
    icon: HandFist,
    links: [
      { id: "ilegais-regulamento", label: "Regulamento", icon: FileText },
      { id: "areas-de-craft", label: "Áreas de Craft", icon: Target },
    ]
  },
  {
    title: "CORPORAÇÕES",
    icon: Buildings,
    links: [
      { id: "corps-regulamento", label: "Regulamento", icon: FileText },
      { id: "investigacoes", label: "Investigações", icon: Crosshair },
      { id: "codigo-penal", label: "Código Penal", icon: Gavel },
    ]
  },
  {
    title: "AÇÕES",
    icon: WarningCircle,
    links: [
      { id: "acoes-regulamento", label: "Regulamento", icon: FileText },
      { id: "emboscadas-e-abordagens", label: "Emboscadas e Abordagens", icon: Target },
      { id: "acoes-de-rua", label: "Ações de Rua", icon: WarningCircle },
      { id: "sequestros", label: "Sequestros", icon: LockKey },
      { id: "negociacoes", label: "Negociações", icon: Users },
      { id: "lojas-de-assalto", label: "Lojas de Assalto", icon: CurrencyCircleDollar },
      { id: "joalheria", label: "Joalheria", icon: CurrencyCircleDollar },
      { 
        id: "banco", label: "Banco", icon: CurrencyCircleDollar,
        subLinks: [
          { id: "agendamento", label: "Agendamento Banco", icon: WarningCircle }
        ]
      },
    ]
  }
];

export default function RulesPage() {
  const [activeRule, setActiveRule] = useState("regras-basicas");
  const [searchQuery, setSearchQuery] = useState("");
  const [rulesData, setRulesData] = useState<RulesData | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    fetch("/api/rules")
      .then(res => res.json())
      .then(data => {
        setRulesData(data);
        if (data?.sections?.length > 0 && activeRule === "regras-basicas") {
          setActiveRule(data.sections[0].id);
        }
      })
      .catch(err => console.error("Erro ao carregar regras:", err));
  }, []);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "regras-basicas": true,
    "areas-civis": true
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "INÍCIO": true,
    "ORGANIZAÇÕES ILEGAIS": true,
    "CORPORAÇÕES": true,
    "AÇÕES": true,
  });
  
  const toggleGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };
  
  // Lista linear de todos os links para a navegação Próximo/Anterior
  const allLinks = sidebarGroups.flatMap(g => 
    g.links.flatMap(link => {
      const links = [link];
      if (link.subLinks) links.push(...link.subLinks);
      return links;
    })
  );
  const currentIndex = allLinks.findIndex(l => l.id === activeRule);
  const prevLink = currentIndex > 0 ? allLinks[currentIndex - 1] : null;
  const nextLink = currentIndex < allLinks.length - 1 ? allLinks[currentIndex + 1] : null;

  // Interceptar cliques nos links internos do GitBook que vieram no HTML
  useEffect(() => {
    const handleInternalLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.classList.contains('internal-link')) {
        e.preventDefault();
        const hash = link.getAttribute('href');
        if (hash && hash.startsWith('#')) {
          const ruleId = hash.substring(1);
          setActiveRule(ruleId);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    document.addEventListener('click', handleInternalLinkClick);
    return () => document.removeEventListener('click', handleInternalLinkClick);
  }, []);

  // Atalho global Ctrl+K para focar na pesquisa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pre-processamento da pesquisa para não travar
  const searchIndex = useMemo(() => {
    if (!rulesData) return [];
    return rulesData.sections.map((section: any) => {
      let plainText = "";
      if (typeof window !== 'undefined') {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = section.html || "";
        plainText = tmp.textContent || tmp.innerText || "";
      } else {
        plainText = section.html || "";
      }
      return {
        ...section,
        searchableText: (section.title + " " + plainText).toLowerCase()
      };
    });
  }, [rulesData]);

  const searchResults = searchQuery.length >= 2 ? searchIndex.filter((section: any) => {
    return section.searchableText.includes(searchQuery.toLowerCase());
  }).map((section: any) => {
    const link = allLinks.find(l => l.id === section.id);
    return {
      ...section,
      label: link ? link.label : section.title
    };
  }) : [];

  // Encontra os dados da regra atual baseada no ID
  const currentRuleData = rulesData?.sections.find((s: any) => s.id === activeRule) || {
    title: "Em Desenvolvimento",
    html: "<p>Esta seção ainda está sendo migrada ou desenvolvida.</p>"
  };

  if (!rulesData) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center pt-20">
        <div className="animate-pulse text-zinc-500">Carregando regulamento...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#111111] flex flex-col pt-24 pb-8">
      <div className="max-w-[1500px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-6 px-4">
        
        {/* SIDEBAR */}
        <aside className="w-full lg:w-[320px] shrink-0 bg-[#171717] rounded-2xl border border-white/5 overflow-hidden flex flex-col max-h-[calc(100vh-120px)] sticky top-24">
          <div className="p-5 border-b border-white/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <BookOpen weight="duotone" className="text-[var(--color-detroit-red)]" />
              Regulamento
            </h2>
            
            <div className="relative w-full flex items-center px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-white/30 focus-within:bg-white/10 transition-colors">
              <MagnifyingGlass size={16} className="text-zinc-400 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-zinc-500 w-full"
              />
              <div className="flex gap-1 text-[10px] font-bold text-zinc-500 ml-2 pointer-events-none">
                <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5">Ctrl</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5">K</kbd>
              </div>
            </div>
          </div>
          
          <div className="overflow-y-auto p-4 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-zinc-700">
            {searchQuery.length >= 2 ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                  Resultados da Pesquisa
                </h3>
                {searchResults.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">Nenhum resultado encontrado.</p>
                ) : (
                  searchResults.map((result: any) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        setActiveRule(result.id);
                        setSearchQuery(""); // Limpa a pesquisa ao clicar
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                    >
                      <span className="text-sm font-medium text-white flex items-center gap-2">
                        <FileText size={16} className="text-[var(--color-detroit-red)]" />
                        {result.label}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : (
              sidebarGroups.map((group, idx) => {
                const isCatExpanded = expandedCategories[group.title] ?? true;
                return (
                <div key={idx} className="flex flex-col mb-4">
                <button 
                  onClick={() => toggleCategory(group.title)}
                  className="flex items-center justify-between text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider hover:text-zinc-300 transition-colors w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <group.icon weight="fill" size={14} />
                    {group.title}
                  </div>
                  <CaretDown weight="bold" size={12} className={`transition-transform duration-300 ${isCatExpanded ? "rotate-0" : "-rotate-90"}`} />
                </button>
                <AnimatePresence>
                  {isCatExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-1 overflow-hidden"
                    >
                      {group.links.map((link) => {
                    const isActive = activeRule === link.id;
                    const hasSubLinks = link.subLinks && link.subLinks.length > 0;
                    // Se estivermos vendo um sub-link dele, o pai fica "semi-ativo" (só com a cor avermelhada levemente)
                    const isParentActive = hasSubLinks && link.subLinks.some(s => s.id === activeRule);
                    const isExpanded = expandedGroups[link.id];
                    
                    return (
                      <div key={link.id} className="flex flex-col">
                        <button
                          onClick={(e) => {
                            setActiveRule(link.id);
                            if (hasSubLinks && !isExpanded) {
                                toggleGroup(link.id, e);
                            }
                          }}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive 
                              ? "bg-[var(--color-detroit-red)]/10 text-[var(--color-detroit-red)]" 
                              : isParentActive
                              ? "text-[var(--color-detroit-red)]"
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <link.icon weight={isActive || isParentActive ? "fill" : "regular"} size={18} />
                            {link.label}
                          </div>
                          {hasSubLinks && (
                            <div 
                              onClick={(e) => toggleGroup(link.id, e)}
                              className="p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <CaretDown 
                                weight="bold" 
                                size={14} 
                                className={`transition-transform duration-300 ${isExpanded ? "rotate-0" : "-rotate-90"} ${isParentActive || isActive ? "text-[var(--color-detroit-red)]" : "text-zinc-500"}`} 
                              />
                            </div>
                          )}
                        </button>
                        
                        {/* Sub-links */}
                        <AnimatePresence>
                          {hasSubLinks && isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-6 mt-1 border-l border-white/10 pl-2 flex flex-col gap-1 overflow-hidden"
                            >
                              {link.subLinks.map((subLink) => {
                                const isSubActive = activeRule === subLink.id;
                                return (
                                  <button
                                    key={subLink.id}
                                    onClick={() => setActiveRule(subLink.id)}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                                      isSubActive 
                                        ? "bg-[var(--color-detroit-red)]/10 text-[var(--color-detroit-red)]" 
                                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                                    }`}
                                  >
                                    <subLink.icon weight={isSubActive ? "fill" : "regular"} size={16} />
                                    {subLink.label}
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
          </div>
        </aside>

        {/* CONTENT AREA */}
        <div className="flex-1 bg-[#171717] rounded-2xl border border-white/5 p-8 lg:p-12 overflow-y-auto max-h-[calc(100vh-120px)] sticky top-24">
          <motion.div
            key={activeRule}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="prose prose-invert prose-red max-w-4xl prose-headings:font-bold prose-a:text-[var(--color-detroit-red)]"
          >
            {/* Title Header */}
            <div className="mb-10 pb-6 border-b border-white/5">
              <h1 className="text-4xl md:text-5xl font-black text-white m-0 tracking-tight flex items-center gap-4">
                {currentRuleData.title}
              </h1>
            </div>
            
            {/* HTML Injetado */}
            <div 
              className="rules-content"
              dangerouslySetInnerHTML={{ __html: currentRuleData.html }} 
            />

            {/* Navegação Anterior / Próxima */}
            <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 justify-between">
              {prevLink ? (
                <button
                  onClick={() => setActiveRule(prevLink.id)}
                  className="flex-1 flex items-center justify-between p-4 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-left group"
                >
                  <span className="text-zinc-500 text-2xl group-hover:-translate-x-1 transition-transform">‹</span>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-zinc-500 font-medium">Anterior</span>
                    <span className="text-white font-medium">{prevLink.label}</span>
                  </div>
                </button>
              ) : <div className="flex-1" />}

              {nextLink ? (
                <button
                  onClick={() => setActiveRule(nextLink.id)}
                  className="flex-1 flex items-center justify-between p-4 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-right group"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-zinc-500 font-medium">Próximo</span>
                    <span className="text-white font-medium">{nextLink.label}</span>
                  </div>
                  <span className="text-zinc-500 text-2xl group-hover:translate-x-1 transition-transform">›</span>
                </button>
              ) : <div className="flex-1" />}
            </div>
            
            <p className="text-xs text-zinc-600 mt-8 pt-4">Last updated today</p>
          </motion.div>
        </div>

      </div>
      
      {/* Estilos para o HTML das Regras */}
      <style jsx global>{`
        .rules-content p {
          color: #a1a1aa;
          line-height: 1.7;
          margin-bottom: 1.25rem;
          font-size: 1rem;
        }
        .rules-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
          color: #a1a1aa;
        }
        .rules-content li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        .rules-content strong {
          color: #f4f4f5;
          font-weight: 700;
        }
      `}</style>
    </main>
  );
}
