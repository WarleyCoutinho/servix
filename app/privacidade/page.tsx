import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Política de Privacidade | Servix",
  description:
    "Saiba como o Servix coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.",
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

const sections = [
  {
    id: "quem-somos",
    title: "1. Quem somos",
    content: (
      <p>
        O <strong className="text-foreground">Servix</strong> é um produto
        desenvolvido e mantido pela{" "}
        <strong className="text-foreground">Adapti Code</strong>, acessível em{" "}
        <a
          href="https://www.servix.app.br"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-lime underline-offset-4 hover:underline"
        >
          https://www.servix.app.br
        </a>
        . Esta Política de Privacidade descreve como coletamos, usamos,
        armazenamos e protegemos as informações dos nossos usuários, em
        conformidade com a{" "}
        <strong className="text-foreground">
          Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018)
        </strong>
        .
      </p>
    ),
  },
  {
    id: "dados-coletados",
    title: "2. Dados que coletamos",
    content: (
      <>
        <p>Podemos coletar as seguintes categorias de dados pessoais:</p>

        <ul className="mt-3 space-y-2">
          {[
            [
              "Dados de cadastro",
              "nome, e-mail, telefone e informações da empresa ao criar uma conta.",
            ],
            [
              "Dados de uso",
              "páginas acessadas, funcionalidades utilizadas, data e hora de acesso, endereço IP e tipo de dispositivo/navegador.",
            ],
            [
              "Dados de pagamento",
              "processados por gateways certificados — não armazenamos dados de cartão em nossos servidores.",
            ],
            [
              "Comunicações",
              "mensagens enviadas ao suporte ou via formulários de contato.",
            ],
            [
              "Cookies e tecnologias similares",
              "para manter sessões, preferências e análises de desempenho.",
            ],
          ].map(([label, desc]) => (
            <li key={label} className="flex gap-3">
              <CheckIcon />

              <span>
                <strong className="text-foreground">{label}:</strong> {desc}
              </span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "uso-dados",
    title: "3. Como utilizamos seus dados",
    content: (
      <ul className="space-y-2">
        {[
          "Prestar, manter e melhorar os serviços do Servix;",
          "Processar pagamentos e gerenciar assinaturas;",
          "Enviar comunicações relacionadas ao serviço (atualizações, alertas de segurança e suporte);",
          "Enviar comunicações de marketing, quando você optar por recebê-las;",
          "Cumprir obrigações legais e regulatórias;",
          "Prevenir fraudes e garantir a segurança da plataforma.",
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <CheckIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "base-legal",
    title: "4. Base legal para o tratamento (LGPD)",
    content: (
      <ul className="space-y-2">
        {[
          ["Execução de contrato", "para fornecer os serviços contratados."],
          [
            "Legítimo interesse",
            "para melhorias de produto, segurança e análises internas.",
          ],
          [
            "Cumprimento de obrigação legal",
            "quando exigido por lei ou autoridade competente.",
          ],
          [
            "Consentimento",
            "para comunicações de marketing e cookies não essenciais.",
          ],
        ].map(([label, desc]) => (
          <li key={label} className="flex gap-3">
            <CheckIcon />

            <span>
              <strong className="text-foreground">{label}:</strong> {desc}
            </span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "compartilhamento",
    title: "5. Compartilhamento de dados",
    content: (
      <>
        <p>
          Não vendemos seus dados pessoais. Podemos compartilhá-los apenas com:
        </p>

        <ul className="mt-3 space-y-2">
          {[
            [
              "Prestadores de serviço",
              "empresas que auxiliam na operação da plataforma, como hospedagem, pagamentos e envio de e-mails, sempre sob obrigação contratual de confidencialidade.",
            ],
            [
              "Autoridades legais",
              "quando exigido por lei, ordem judicial ou para proteção de direitos.",
            ],
            [
              "Parceiros de negócio",
              "somente mediante seu consentimento prévio e expresso.",
            ],
          ].map(([label, desc]) => (
            <li key={label} className="flex gap-3">
              <CheckIcon />

              <span>
                <strong className="text-foreground">{label}:</strong> {desc}
              </span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "retencao",
    title: "6. Retenção de dados",
    content: (
      <p>
        Mantemos seus dados pelo período necessário para cumprir as finalidades
        descritas nesta política ou conforme exigido por lei. Dados de contas
        encerradas são eliminados ou anonimizados em até{" "}
        <strong className="text-foreground">90 dias</strong>, salvo obrigações
        legais de guarda mais longas.
      </p>
    ),
  },
  {
    id: "seguranca",
    title: "7. Segurança",
    content: (
      <p>
        Adotamos medidas técnicas e organizacionais adequadas para proteger seus
        dados contra acesso não autorizado, perda, alteração ou divulgação,
        incluindo criptografia em trânsito (TLS), controle de acesso por função
        e monitoramento contínuo.
      </p>
    ),
  },
  {
    id: "direitos",
    title: "8. Seus direitos (LGPD)",
    content: (
      <>
        <p>Como titular de dados, você tem direito a:</p>

        <ul className="mt-3 space-y-2">
          {[
            "Confirmar a existência de tratamento dos seus dados;",
            "Acessar os dados que temos sobre você;",
            "Corrigir dados incompletos, inexatos ou desatualizados;",
            "Solicitar anonimização, bloqueio ou eliminação de dados desnecessários;",
            "Revogar o consentimento a qualquer momento;",
            "Solicitar a portabilidade dos seus dados a outro fornecedor;",
            "Ser informado sobre as consequências de não fornecer o consentimento.",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <CheckIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4">
          Para exercer qualquer desses direitos, entre em contato pelo e-mail{" "}
          <a
            href="mailto:contatoadapticode@gmail.com"
            className="font-semibold text-lime underline-offset-4 hover:underline"
          >
            contatoadapticode@gmail.com
          </a>
          . Responderemos em até{" "}
          <strong className="text-foreground">15 dias úteis</strong>.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "9. Cookies",
    content: (
      <p>
        Utilizamos cookies essenciais para funcionamento da plataforma e cookies
        analíticos para entender como os usuários interagem com o Servix. Você
        pode gerenciar suas preferências nas configurações do navegador.
      </p>
    ),
  },
  {
    id: "links",
    title: "10. Links externos",
    content: (
      <p>
        O Servix pode conter links para sites de terceiros. Não somos
        responsáveis pelas práticas de privacidade desses sites e recomendamos a
        leitura das respectivas políticas.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "11. Alterações nesta política",
    content: (
      <p>
        Podemos atualizar esta Política periodicamente. Alterações relevantes
        serão comunicadas por e-mail ou aviso na plataforma.
      </p>
    ),
  },
  {
    id: "contato",
    title: "12. Contato",
    content: (
      <>
        <p>
          Dúvidas, solicitações ou reclamações relacionadas a esta política
          devem ser encaminhadas para:
        </p>

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

export default function PrivacidadePage() {
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
                Privacidade &amp; LGPD
              </span>
            </div>

            <h1 className="font-display text-4xl font-black uppercase tracking-tight text-foreground">
              Política de Privacidade
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Última atualização:{" "}
              <strong className="text-foreground">21 de maio de 2025</strong>
            </p>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              A Adapti Code respeita sua privacidade e está comprometida com a
              proteção dos seus dados pessoais conforme a LGPD.
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
              Leia também nossos{" "}
              <Link
                href="/termos"
                className="font-semibold text-lime underline-offset-4 hover:underline"
              >
                Termos de Uso
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
