import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>College ERP System</title>
        <meta name="description" content="Comprehensive College ERP system for CSE-AIML department" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}