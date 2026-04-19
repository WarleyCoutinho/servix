import Image from "next/image";
import Link from "next/link";
import logoDark from "@/public/servix_logo_horizontal.svg";
import logoLight from "@/public/servix_logo_light.svg";
import AdapticodeIcon from "../components/adapticode-icon";

const LinkedInIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/adapti-code/",
    icon: <LinkedInIcon />,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/adapticode/",
    icon: <InstagramIcon />,
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 gap-12 border-b border-border/60 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-5">
            <Image
              src={logoLight}
              alt="Servix"
              width={140}
              height={40}
              className="block dark:hidden"
            />
            <Image
              src={logoDark}
              alt="Servix"
              width={140}
              height={40}
              className="hidden dark:block"
            />
            <p className="max-w-65 text-sm leading-relaxed text-muted-foreground">
              A plataforma completa para barbearias e salões modernos. Gestão de
              agendamentos, profissionais e pagamentos em um só lugar.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5">
              <span className="relative flex size-1.75">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
                <span className="relative inline-flex size-1.75 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium tracking-wide text-emerald-600 dark:text-emerald-400">
                Plataforma ativa
              </span>
            </div>
          </div>

          {/* Plataforma */}
          <div className="space-y-5">
            <h4 className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/30">
              Plataforma
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Início", href: "/home" },
                { label: "Barbearias e salões", href: "/barbershops" },
                { label: "Meus agendamentos", href: "/bookings" },
                { label: "Conheça o Servix", href: "/" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-5">
            <h4 className="text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/30">
              Legal
            </h4>
            <ul className="space-y-3">
              {["Termos de uso", "Política de privacidade", "Cookies"].map(
                (item) => (
                  <li key={item}>
                    <span className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {item}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <p className="text-[11px] tracking-wide text-muted-foreground/70">
            &copy; {new Date().getFullYear()} Servix — Todos os direitos
            reservados.
          </p>

          <div className="flex items-center gap-4">
            {/* Label + Badge Adapticode */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground/60">
                Desenvolvido por
              </span>
              <Link
                href="https://www.adapticode.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-1.25 transition-colors hover:border-border"
              >
                <AdapticodeIcon size={24} />
                <span
                  className="text-[11px] font-bold tracking-[0.08em]"
                  style={{
                    background:
                      "linear-gradient(135deg, #3B5BDB, #9B4DCA, #F03E7A)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  ADAPTI CODE
                </span>
              </Link>
            </div>

            {/* Divisor */}
            <div className="h-4 w-px bg-border/60" />

            {/* Redes sociais */}
            <div className="flex items-center gap-1.5">
              {socialLinks.map(({ label, href, icon }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-7.5 items-center justify-center rounded-[7px] border border-border/60 text-muted-foreground/60 transition-colors hover:border-border hover:text-muted-foreground"
                >
                  {icon}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
