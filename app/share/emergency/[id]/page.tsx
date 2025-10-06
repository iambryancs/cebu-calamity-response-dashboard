import { Metadata } from 'next';

interface SharePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    // Fetch emergency data for dynamic metadata
    const response = await fetch(`${baseUrl}/api/share/emergency/${params.id}`, {
      cache: 'no-store' // Ensure fresh data
    });
    
    if (response.ok) {
      const data = await response.json();
      
      return {
        title: `${data.title} - Cebu Emergency Relief Dashboard`,
        description: data.description,
        openGraph: {
          title: data.title,
          description: data.description,
          type: 'website',
          url: data.url,
          siteName: 'Cebu Emergency Relief Dashboard',
          images: [
            {
              url: data.image,
              width: 1200,
              height: 630,
              alt: 'Cebu Emergency Relief Dashboard',
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: data.title,
          description: data.description,
          images: [data.image],
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  
  // Fallback metadata
  return {
    title: 'Emergency Relief Request - Cebu Emergency Relief Dashboard',
    description: 'Help coordinate emergency relief efforts in Cebu. View emergency details and relief status.',
    openGraph: {
      title: 'Emergency Relief Request - Cebu Emergency Relief Dashboard',
      description: 'Help coordinate emergency relief efforts in Cebu. View emergency details and relief status.',
      type: 'website',
      url: `${baseUrl}/share/emergency/${params.id}`,
      siteName: 'Cebu Emergency Relief Dashboard',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'Cebu Emergency Relief Dashboard',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Emergency Relief Request - Cebu Emergency Relief Dashboard',
      description: 'Help coordinate emergency relief efforts in Cebu. View emergency details and relief status.',
      images: [`${baseUrl}/og-image.png`],
    },
  };
}

export default function SharePage({ params }: SharePageProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚨 Emergency Relief Request
          </h1>
          <p className="text-gray-600">
            Emergency ID: {params.id}
          </p>
        </div>
        
        <div className="mb-8">
          <p className="text-lg text-gray-700 mb-4">
            This emergency needs immediate attention and relief coordination.
          </p>
          <p className="text-gray-600">
            Please visit our main dashboard to view detailed emergency information and help coordinate relief efforts.
          </p>
        </div>
        
        <div className="space-y-4">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Emergency Dashboard
          </a>
          
          <div className="text-sm text-gray-500">
            <p>Share this link to help increase visibility for this emergency</p>
          </div>
        </div>
      </div>
    </div>
  );
}

