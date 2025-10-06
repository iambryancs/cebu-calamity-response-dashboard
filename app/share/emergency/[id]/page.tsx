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
  
  // Fallback metadata with random share image
  const shareImages = ['share_a.jpg', 'share_b.jpg', 'share_c.jpg', 'share_d.jpg', 'share_e.jpg'];
  const randomImage = shareImages[Math.floor(Math.random() * shareImages.length)];
  
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
          url: `${baseUrl}/${randomImage}`,
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
      images: [`${baseUrl}/${randomImage}`],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let emergencyData = null;
  
  try {
    const response = await fetch(`${baseUrl}/api/share/emergency/${params.id}`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      emergencyData = data.emergency;
    }
  } catch (error) {
    console.error('Error fetching emergency data:', error);
  }

  if (!emergencyData) {
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
          </div>
        </div>
      </div>
    );
  }

  const hasRelief = emergencyData.hasReliefAction;
  const distanceText = emergencyData.reliefActionDistance && emergencyData.reliefActionDistance < 1 
    ? `${(emergencyData.reliefActionDistance * 1000).toFixed(0)}m away`
    : emergencyData.reliefActionDistance ? `${emergencyData.reliefActionDistance.toFixed(1)}km away` : '';

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
          <h1 className="text-3xl font-bold mb-2">
            🚨 Emergency Relief Request
          </h1>
          <p className="text-lg opacity-90">
            {hasRelief ? 'Relief Available' : 'Urgent Help Needed'}
          </p>
        </div>

        {/* Emergency Details */}
        <div className="p-6 space-y-6">
          {/* Location */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">📍 Location</h4>
              <p className="text-sm text-gray-700">{emergencyData.placename}</p>
              <a 
                href={`https://www.google.com/maps?q=${emergencyData.latitude},${emergencyData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
              >
                View on Map ({emergencyData.latitude.toFixed(4)}, {emergencyData.longitude.toFixed(4)})
              </a>
            </div>
          </div>

          {/* People Affected */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">👥 People Affected</h4>
              <p className="text-sm text-gray-700 font-semibold text-lg">{emergencyData.numberOfPeople} people</p>
            </div>
          </div>

          {/* Urgency Level */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">⚡ Urgency Level</h4>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                emergencyData.urgencyLevel === 'CRITICAL' ? 'bg-red-200 text-red-900 border-red-300 font-bold' :
                emergencyData.urgencyLevel === 'HIGH' ? 'bg-red-100 text-red-800 border-red-200' :
                emergencyData.urgencyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-green-100 text-green-800 border-green-200'
              }`}>
                {emergencyData.urgencyLevel}
              </span>
            </div>
          </div>

          {/* Needs */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-2">🛠️ Required Needs</h4>
              {emergencyData.needs && emergencyData.needs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {emergencyData.needs.map((need: string, index: number) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 italic">No needs specified</span>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">🚩 Current Status</h4>
              {hasRelief ? (
                <div className="flex flex-col space-y-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Relief Available
                  </span>
                  <span className="text-xs text-gray-500">
                    {distanceText}
                  </span>
                </div>
              ) : (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  emergencyData.status === 'pending' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                  emergencyData.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  emergencyData.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-200' :
                  'bg-gray-100 text-gray-800 border-gray-200'
                }`}>
                  {emergencyData.status}
                </span>
              )}
            </div>
          </div>

          {/* Relief Action Details */}
          {hasRelief && emergencyData.reliefActionDetails && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-2">🎁 Relief Action Details</h4>
                <div className="bg-green-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Donor:</span>
                    <span className="text-sm text-gray-900">{emergencyData.reliefActionDetails.DonorName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Type:</span>
                    <span className="text-sm text-gray-900">{emergencyData.reliefActionDetails.DonorType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Items:</span>
                    <span className="text-sm text-gray-900">{emergencyData.reliefActionDetails.DonatedItems.join(', ')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <span className="text-sm text-gray-900">{emergencyData.reliefActionDetails.Status}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Distance:</span>
                    <span className="text-sm text-gray-900">{distanceText}</span>
                  </div>
                  {emergencyData.reliefActionDetails.ContactNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Contact:</span>
                      <span className="text-sm text-gray-900 font-mono">{emergencyData.reliefActionDetails.ContactNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">⏰ Reported At</h4>
              <p className="text-sm text-gray-700">{formatTimestamp(emergencyData.timestamp)}</p>
            </div>
          </div>

          {/* Additional Notes */}
          {emergencyData.additionalNotes && emergencyData.additionalNotes.trim() !== '' && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-2">📝 Additional Notes</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{emergencyData.additionalNotes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <p>Share this link to help increase visibility for this emergency</p>
            </div>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Full Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

