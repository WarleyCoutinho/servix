import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <h4 className="text-sm font-bold">Servix</h4>
            <p className="max-w-xs text-sm text-muted-foreground">
              A plataforma para barbearias e salões modernos.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
              Plataforma
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-foreground"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/barbershops"
                  className="transition-colors hover:text-foreground"
                >
                  Barbearias
                </Link>
              </li>
              <li>
                <Link
                  href="/bookings"
                  className="transition-colors hover:text-foreground"
                >
                  Agendamentos
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Termos de Uso</li>
              <li>Privacidade</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Servix. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Feito com cuidado para barbearias.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
