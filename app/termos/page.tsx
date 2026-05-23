import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Termos de Uso | Servix",
  description:
    "Leia os Termos de Uso do Servix antes de utilizar a plataforma.",
};

const CheckIcon = () => (
  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-lime">
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
      <path
        d="M1 4l2.5 2.5L9 1"
        stroke="oklch(0.1 0 0)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const XIcon = () => (
  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-destructive/15">
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M2 2l6 6M8 2l-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="text-destructive"
      />
    </svg>
  </span>
);

const sections = [
  {
    id: "aceitacao",
    title: "1. Aceitação dos Termos",
    content: (
      <>
        <p>
          Ao acessar ou utilizar o{" "}
          <strong className="text-foreground">Servix</strong> (
          <a
            href="https://www.servix.app.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-lime underline-offset-4 hover:underline"
          >
            https://www.servix.app.br
          </a>
          ), você concorda com estes Termos de Uso e com a nossa{" "}
          <Link
            href="/privacidade"
            className="font-semibold text-lime underline-offset-4 hover:underline"
          >
            Política de Privacidade
          </Link>
          . Caso não concorde com qualquer disposição, não utilize a plataforma.
        </p>

        <p className="mt-3">
          O Servix é operado pela{" "}
          <strong className="text-foreground">Adapti Code</strong>. Estes Termos
          constituem um contrato vinculante entre você (usuário) e a Adapti
          Code.
        </p>
      </>
    ),
  },
  {
    id: "descricao",
    title: "2. Descrição do serviço",
    content: (
      <p>
        O Servix é uma plataforma de gestão voltada para prestadores de
        serviços, oferecendo funcionalidades como agendamento, controle
        financeiro, comunicação com clientes, relatórios e automações. As
        funcionalidades disponíveis podem variar conforme o plano contratado.
      </p>
    ),
  },
  {
    id: "elegibilidade",
    title: "3. Elegibilidade",
    content: (
      <>
        <p>Para utilizar o Servix, você deve:</p>

        <ul className="mt-3 space-y-2">
          {[
            "Ter pelo menos 18 anos de idade;",
            "Possuir capacidade legal para celebrar contratos;",
            "Fornecer informações verdadeiras, precisas e atualizadas.",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <CheckIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-3">
          O uso em nome de empresa requer autorização de representante
          legalmente habilitado.
        </p>
      </>
    ),
  },
  {
    id: "conta",
    title: "4. Conta de usuário",
    content: (
      <>
        <p>
          Você é responsável por manter a confidencialidade das suas credenciais
          de acesso e por todas as atividades realizadas em sua conta.
        </p>

        <p className="mt-3">
          Caso identifique qualquer uso não autorizado, entre em contato
          imediatamente pelo e-mail{" "}
          <a
            href="mailto:contatoadapticode@gmail.com"
            className="font-semibold text-lime underline-offset-4 hover:underline"
          >
            contatoadapticode@gmail.com
          </a>
          .
        </p>

        <p className="mt-3">
          A Adapti Code poderá suspender ou encerrar contas que violem estes
          Termos ou comprometam a segurança da plataforma.
        </p>
      </>
    ),
  },
  {
    id: "pagamentos",
    title: "5. Planos e pagamentos",
    content: (
      <>
        <p>
          O Servix pode oferecer planos gratuitos e pagos. Valores, recursos e
          ciclos de cobrança são informados na página oficial de planos.
        </p>

        <ul className="mt-3 space-y-2">
          {[
            "Pagamentos são processados por gateways seguros de terceiros;",
            "Assinaturas podem ser renovadas automaticamente até cancelamento;",
            "Cancelamentos não geram reembolso proporcional, salvo exigência legal;",
            "Os preços poderão ser alterados mediante aviso prévio.",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <CheckIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "uso-aceitavel",
    title: "6. Uso aceitável",
    content: (
      <>
        <p>Você concorda em não utilizar o Servix para:</p>

        <ul className="mt-3 space-y-2">
          {[
            "Violar leis ou regulamentos aplicáveis;",
            "Publicar conteúdo ilegal, ofensivo ou difamatório;",
            "Tentar acessar áreas restritas da plataforma;",
            "Realizar engenharia reversa ou extração de código-fonte;",
            "Executar ataques, automações abusivas ou scraping massivo;",
            "Criar contas falsas ou se passar por terceiros.",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <XIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "propriedade",
    title: "7. Propriedade intelectual",
    content: (
      <>
        <p>
          Todo o conteúdo, marca, design, software e tecnologia do Servix são de
          propriedade exclusiva da Adapti Code ou de seus licenciantes.
        </p>

        <p className="mt-3">
          É proibida qualquer reprodução, distribuição, modificação ou uso não
          autorizado sem consentimento prévio por escrito.
        </p>
      </>
    ),
  },
  {
    id: "disponibilidade",
    title: "8. Disponibilidade e manutenção",
    content: (
      <p>
        Buscamos manter o Servix disponível continuamente, porém não garantimos
        funcionamento ininterrupto. Poderemos realizar manutenções programadas
        ou emergenciais sempre que necessário.
      </p>
    ),
  },
  {
    id: "responsabilidade",
    title: "9. Limitação de responsabilidade",
    content: (
      <>
        <p>
          Na máxima extensão permitida por lei, a Adapti Code não será
          responsável por danos indiretos, lucros cessantes ou perdas de dados
          decorrentes do uso da plataforma.
        </p>

        <p className="mt-3">
          A responsabilidade total da Adapti Code ficará limitada ao valor pago
          pelo usuário nos últimos{" "}
          <strong className="text-foreground">3 meses</strong>.
        </p>
      </>
    ),
  },
  {
    id: "garantias",
    title: "10. Isenção de garantias",
    content: (
      <p>
        O Servix é fornecido “como está”, sem garantias de disponibilidade
        contínua, ausência de falhas ou adequação a finalidades específicas.
      </p>
    ),
  },
  {
    id: "rescisao",
    title: "11. Rescisão",
    content: (
      <>
        <p>
          Você pode encerrar sua conta a qualquer momento pelo painel da
          plataforma ou solicitando pelo e-mail{" "}
          <a
            href="mailto:contatoadapticode@gmail.com"
            className="font-semibold text-lime underline-offset-4 hover:underline"
          >
            contatoadapticode@gmail.com
          </a>
          .
        </p>

        <p className="mt-3">
          A Adapti Code poderá suspender ou cancelar contas em caso de violação
          destes Termos.
        </p>
      </>
    ),
  },
  {
    id: "alteracoes-termos",
    title: "12. Alterações nos Termos",
    content: (
      <p>
        Estes Termos poderão ser atualizados periodicamente. Alterações
        relevantes serão comunicadas por e-mail ou aviso na plataforma.
      </p>
    ),
  },
  {
    id: "lei",
    title: "13. Lei aplicável e foro",
    content: (
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil.
        Fica eleito o foro da comarca de{" "}
        <strong className="text-foreground">São Paulo – SP</strong> para
        resolução de eventuais controvérsias.
      </p>
    ),
  },
  {
    id: "contato",
    title: "14. Contato",
    content: (
      <>
        <p>Dúvidas sobre estes Termos podem ser encaminhadas para:</p>

        <div className="mt-4 space-y-1 rounded-xl border border-lime-border bg-lime-muted p-4 text-sm">
          <p>
            <span className="text-muted-foreground">Empresa:</span>{" "}
            <strong className="text-foreground">Adapti Code</strong>
          </p>

          <p>
            <span className="text-muted-foreground">E-mail:</span>{" "}
            <a
              href="mailto:contatoadapticode@gmail.com"
              className="font-semibold text-lime underline-offset-4 hover:underline"
            >
              contatoadapticode@gmail.com
            </a>
          </p>

          <p>
            <span className="text-muted-foreground">Site:</span>{" "}
            <a
              href="https://www.adapticode.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-lime underline-offset-4 hover:underline"
            >
              https://www.adapticode.com.br
            </a>
          </p>
        </div>
      </>
    ),
  },
];

export default function TermosPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-background text-foreground">
        {/* Hero */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded border border-lime-border bg-lime-muted px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-lime" />

              <span className="font-display text-xs font-bold uppercase tracking-widest text-lime">
                Termos Legais
              </span>
            </div>

            <h1 className="font-display text-4xl font-black uppercase tracking-tight text-foreground">
              Termos de Uso
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Última atualização:{" "}
              <strong className="text-foreground">21 de maio de 2025</strong>
            </p>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Ao utilizar o Servix, você concorda com as condições descritas
              abaixo. Leia atentamente antes de continuar.
            </p>
          </div>
        </div>

        {/* Seções */}
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-12">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <h2 className="font-display mb-4 text-xl font-black uppercase tracking-tight text-foreground">
                {section.title}
              </h2>

              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {section.content}
              </div>
            </section>
          ))}

          {/* Nav footer */}
          <div className="flex flex-col gap-4 rounded-xl border border-lime-border bg-lime-muted px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Leia também nossa{" "}
              <Link
                href="/privacidade"
                className="font-semibold text-lime underline-offset-4 hover:underline"
              >
                Política de Privacidade
              </Link>
            </p>

            <Link
              href="/marketing"
              className="btn-lime rounded-lg px-4 py-2 text-center text-sm"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
