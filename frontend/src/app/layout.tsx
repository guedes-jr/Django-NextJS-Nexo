import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEXO | Gestão Inteligente de Patrimônio',
  description: 'Plataforma completa de gerenciamento de investimentos e consolidação patrimonial.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
