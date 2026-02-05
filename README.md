This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# migração

1️⃣ Apague migrations antigas (se existirem)

rm -rf prisma/migrations

2️⃣ Crie uma migration limpa

pnpm prisma migrate dev --name init

3️⃣ Gere o Prisma Client

pnpm prisma generate

4️⃣ Rode o seed novamente

pnpm exec tsx prisma/seed.ts

# servix

Descrição comercial para o site (versão principal)

Essa é a descrição que você pode usar logo na home ou na landing page:

Servix é uma plataforma SaaS desenvolvida para simplificar e profissionalizar a gestão de barbearias, salões de beleza e negócios de estética.

Com o Servix, você centraliza agenda, clientes, profissionais, serviços e pagamentos em um único sistema, ganhando mais controle, organização e eficiência no dia a dia.

Criado para quem quer crescer, o Servix oferece uma experiência moderna, segura e intuitiva, permitindo que você foque no que realmente importa: seus clientes e o sucesso do seu negócio.

# EXECULTAR SCRIPTS SO MUDAR O SCRIPT

pnpm tsx scripts/set-admin.ts seu-email@exemplo.com

A única configuração específica para Neon é o channel_binding=require que já estava na sua URL de conexão. Os parâmetros connect_timeout e  
 pool_timeout que adicionei são padrões do PostgreSQL e funcionam em qualquer provedor.

Se quiser ajustar os timeouts para outro provedor, basta alterar em lib/prisma.ts:12-13:

url.searchParams.set("connect_timeout", "10"); // segundos  
 url.searchParams.set("pool_timeout", "10"); // segundos
