import type { Metadata } from 'next';
import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const metadata: Metadata = {
  title: 'Cebu Emergency Relief Dashboard',
  description: 'Statistical analysis of emergency relief data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" 
            style={{
              backgroundImage: 'url(/background.png)',
            }}>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        
        {/* Background overlay for better readability */}
        <div className="min-h-screen bg-black bg-opacity-40">
          {children}
        </div>
      </body>
    </html>
  );
}
