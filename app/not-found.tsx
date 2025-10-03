import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md mx-4 border border-white border-opacity-20">
        <div className="text-center">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            The emergency page you're looking for doesn't exist. 
            Let's get you back to safety!
          </p>
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
