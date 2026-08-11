import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Freebies Near Me',
  description: 'Free giveaways, samples, and pop up events happening in Toronto right now.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
