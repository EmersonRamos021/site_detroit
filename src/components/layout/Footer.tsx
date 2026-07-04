import Image from "next/image";
import { DiscordLogo, InstagramLogo, TwitterLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-zinc-950 mt-12 py-16 px-6 relative z-10">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* BRAND INFO */}
        <div>
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center group relative w-[140px] h-10 overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
              <Image 
                src="/logodetroit.png" 
                alt="Detroit Roleplay" 
                fill
                className="object-cover object-center"
              />
            </Link>
            <p className="text-zinc-500 text-sm max-w-sm">
              O servidor de roleplay mais avançado da comunidade. Entre no Discord, faça sua whitelist e inicie sua jornada na cidade de Detroit.
            </p>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-semibold">Navegação</h4>
          <ul className="flex flex-col gap-2 text-sm text-zinc-400">
            <li><Link href="/" className="hover:text-[var(--color-detroit-red)] transition-colors">Início</Link></li>
            <li><Link href="#store" className="hover:text-[var(--color-detroit-red)] transition-colors">Loja</Link></li>
            <li><Link href="#" className="hover:text-[var(--color-detroit-red)] transition-colors">Termos & Condições</Link></li>
            <li><Link href="#" className="hover:text-[var(--color-detroit-red)] transition-colors">Política de Reembolso</Link></li>
          </ul>
        </div>

        {/* SOCIALS */}
        <div className="flex flex-col gap-4 md:items-end">
          <h4 className="text-white font-semibold">Comunidade</h4>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-[var(--color-detroit-red)] transition-all hover:-translate-y-1">
              <DiscordLogo weight="fill" size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-[var(--color-detroit-red)] transition-all hover:-translate-y-1">
              <InstagramLogo weight="fill" size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-[var(--color-detroit-red)] transition-all hover:-translate-y-1">
              <TwitterLogo weight="fill" size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
        <p>&copy; {new Date().getFullYear()} Detroit Roleplay. Todos os direitos reservados.</p>
        <p>Não somos afiliados à Rockstar Games ou Take-Two Interactive.</p>
      </div>
    </footer>
  );
}
