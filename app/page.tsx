'use client';

import { useState, useEffect } from 'react';
import { EmergencyResponse, DashboardStats, ChartData } from '@/types/emergency';
import { BarChart, DoughnutChart, PieChart } from '@/components/ChartComponents';

export default function Dashboard() {
  const [data, setData] = useState<EmergencyResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'urgencyLevel' | 'numberOfPeople' | 'timestamp' | 'status'>('urgencyLevel');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyResponse['data'][0] | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [cacheInfo, setCacheInfo] = useState<{cached?: boolean, stale?: boolean, lastUpdated?: string, nextUpdate?: string, cacheSource?: string, debug?: any} | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 100;

  useEffect(() => {
    loadEmergencyData();
  }, []);

  const loadEmergencyData = async () => {
    try {
      const response = await fetch('/api/emergencies');
      if (!response.ok) {
        throw new Error('Failed to load data');
      }
      const emergencyData: EmergencyResponse = await response.json();
      
      // Check response headers for more accurate cache status
      const vercelCacheStatus = response.headers.get('x-vercel-cache');
      const debugInfo = response.headers.get('x-debug-info');
      
      // Override cache info based on actual response headers
      if (vercelCacheStatus === 'HIT') {
        emergencyData.cached = true;
        emergencyData.cacheSource = 'cdn';
        if (emergencyData.debug) {
          emergencyData.debug.environment = 'production';
        }
      }
      
      if (!emergencyData.success || !emergencyData.data) {
        throw new Error('Invalid data format');
      }

      setData(emergencyData);
      const calculatedStats = generateStatistics(emergencyData.data);
      setStats(calculatedStats);
      setCacheInfo({
        cached: emergencyData.cached,
        stale: emergencyData.stale,
        lastUpdated: emergencyData.lastUpdated,
        nextUpdate: emergencyData.nextUpdate,
        cacheSource: emergencyData.cacheSource,
        debug: emergencyData.debug
      });
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const generateStatistics = (emergencyData: EmergencyResponse['data']): DashboardStats => {
    // Summary statistics
    const totalEmergencies = emergencyData.length;
    const totalPeople = emergencyData.reduce((sum, item) => sum + (item.numberOfPeople || 0), 0);
    const avgPeople = totalPeople / totalEmergencies;
    const pendingCount = emergencyData.filter(item => item.status === 'pending').length;

    // Calculate median for more robust average
    const peopleCounts = emergencyData.map(item => item.numberOfPeople || 0).sort((a, b) => a - b);
    const median = peopleCounts.length % 2 === 0 
      ? (peopleCounts[peopleCounts.length / 2 - 1] + peopleCounts[peopleCounts.length / 2]) / 2
      : peopleCounts[Math.floor(peopleCounts.length / 2)];

    // Calculate average without extreme outliers (filter out > 500 people)
    const filteredData = emergencyData.filter(item => (item.numberOfPeople || 0) <= 500);
    const filteredTotalPeople = filteredData.reduce((sum, item) => sum + (item.numberOfPeople || 0), 0);
    const filteredAvgPeople = filteredData.length > 0 ? filteredTotalPeople / filteredData.length : avgPeople;

    // Analyze needs
    const needsCount: Record<string, number> = {};
    emergencyData.forEach(item => {
      if (item.needs && Array.isArray(item.needs)) {
        item.needs.forEach(need => {
          needsCount[need] = (needsCount[need] || 0) + 1;
        });
      }
    });
    const needsStats = Object.entries(needsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }));

    // Analyze urgency
    const urgencyCount: Record<string, number> = {};
    emergencyData.forEach(item => {
      if (item.urgencyLevel) {
        urgencyCount[item.urgencyLevel] = (urgencyCount[item.urgencyLevel] || 0) + 1;
      }
    });
    const urgencyStats = Object.entries(urgencyCount)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));

    // Analyze status
    const statusCount: Record<string, number> = {};
    emergencyData.forEach(item => {
      if (item.status) {
        statusCount[item.status] = (statusCount[item.status] || 0) + 1;
      }
    });
    const statusStats = Object.entries(statusCount)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label: label.charAt(0).toUpperCase() + label.slice(1), value }));


    return {
      totalEmergencies,
      totalPeople,
      avgPeople: Math.round(filteredAvgPeople), // Use filtered average to remove extreme outliers
      pendingCount,
      needsStats,
      urgencyStats,
      statusStats,
    };
  };

  const createChartData = (stats: { label: string; value: number }[]): ChartData => ({
    labels: stats.map(item => item.label),
    datasets: [{
      label: 'Count',
      data: stats.map(item => item.value),
    }],
  });

  const handleSort = (field: 'urgencyLevel' | 'numberOfPeople' | 'timestamp' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filterAndSortData = (emergencies: EmergencyResponse['data']) => {
    // First filter by search query
    const filteredData = searchQuery.trim() === '' 
      ? emergencies 
      : emergencies.filter(emergency => {
          const searchLower = searchQuery.toLowerCase();
          return (
            emergency.placename.toLowerCase().includes(searchLower) ||
            emergency.contactno.toLowerCase().includes(searchLower) ||
            emergency.urgencyLevel.toLowerCase().includes(searchLower) ||
            emergency.status.toLowerCase().includes(searchLower) ||
            emergency.additionalNotes.toLowerCase().includes(searchLower) ||
            emergency.needs.some(need => need.toLowerCase().includes(searchLower)) ||
            emergency.numberOfPeople.toString().includes(searchLower)
          );
        });

    // Then sort the filtered data
    return [...filteredData].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'urgencyLevel':
          // Custom order: HIGH > MEDIUM > LOW
          const urgencyOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          aValue = urgencyOrder[a.urgencyLevel as keyof typeof urgencyOrder] || 0;
          bValue = urgencyOrder[b.urgencyLevel as keyof typeof urgencyOrder] || 0;
          break;
        case 'numberOfPeople':
          aValue = a.numberOfPeople || 0;
          bValue = b.numberOfPeople || 0;
          break;
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'status':
          // Custom order: pending > in-progress > resolved > cancelled
          const statusOrder = { 'pending': 4, 'in-progress': 3, 'resolved': 2, 'cancelled': 1 };
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0;
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const getPaginatedData = (emergencies: EmergencyResponse['data']) => {
    const filteredAndSorted = filterAndSortData(emergencies);
    const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      data: filteredAndSorted.slice(startIndex, endIndex),
      totalItems: filteredAndSorted.length,
      totalPages,
      currentPage: Math.min(currentPage, totalPages || 1)
    };
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1); // Reset to first page when clearing search
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRowClick = (emergency: EmergencyResponse['data'][0]) => {
    setSelectedEmergency(emergency);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmergency(null);
  };

  // Helper functions for formatting data
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

  const formatLocation = (placename: string, lat: number, lon: number) => {
    const shortLocation = placename.length > 50 ? placename.substring(0, 50) + '...' : placename;
    return (
      <div>
        <div className="font-medium text-gray-900">{shortLocation}</div>
        <div className="text-xs text-gray-500 mt-1">
          <a 
            href={`https://www.google.com/maps?q=${lat},${lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            📍 View on Map ({lat.toFixed(4)}, {lon.toFixed(4)})
          </a>
        </div>
      </div>
    );
  };

  const formatNeeds = (needs: string[]) => {
    if (!needs || needs.length === 0) return <span className="text-gray-400 italic">No needs specified</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {needs.map((need, needIndex) => (
          <span 
            key={needIndex}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {need}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-black bg-opacity-60 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-xl text-white">Loading emergency relief data and generating statistics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 bg-opacity-95 backdrop-blur-sm border-l-4 border-red-400 p-6 rounded-lg max-w-md shadow-xl border border-white border-opacity-20">
          <div className="flex items-center">
            <div className="text-red-400 text-2xl mr-3">❌</div>
            <div>
              <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats || !data) return null;

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-7xl mx-auto bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white border-opacity-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-8 text-center">
          <h1 className="text-4xl font-light mb-2">🚨 Cebu Emergency Relief Dashboard</h1>
          <p className="text-xl opacity-90">Statistical analysis of emergency relief data</p>
          
          {/* Cache Status Indicator */}
          {cacheInfo && (
            <div className="mt-4 flex justify-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                cacheInfo.stale 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : cacheInfo.cached 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
              }`}>
                {cacheInfo.stale ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Using cached data (API unavailable)
                  </>
                ) : cacheInfo.cached ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Cached data (updates every 3 minutes)
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {cacheInfo?.cacheSource === 'cdn' ? 'CDN Cached data' : 
                     cacheInfo?.cacheSource === 'memory' ? 'Memory cached data' : 
                     'Live data from API'}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
          <div className="summary-card">
            <div className="summary-number">{stats.totalEmergencies.toLocaleString()}</div>
            <div className="summary-label">Total Emergencies</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{stats.totalPeople.toLocaleString()}</div>
            <div className="summary-label">Total People Affected</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{stats.avgPeople}</div>
            <div className="summary-label">Avg People per Emergency</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{stats.pendingCount}</div>
            <div className="summary-label">Pending Cases</div>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 p-8">
          {/* Most Requested Needs */}
          <div className="stat-card">
            <h3 className="text-xl font-semibold text-gray-800 mb-5 pb-2 border-b-4 border-red-500">📋 Most Requested Needs</h3>
            <div className="space-y-2 mb-6">
              {stats.needsStats.slice(0, 5).map((item, index) => (
                <div key={index} className="stat-item">
                  <span className="stat-label">{item.label}</span>
                  <span className="stat-value">{item.value}</span>
                </div>
              ))}
            </div>
            <BarChart data={createChartData(stats.needsStats)} title="Most Requested Needs" />
          </div>

          {/* Urgency Level Distribution */}
          <div className="stat-card">
            <h3 className="text-xl font-semibold text-gray-800 mb-5 pb-2 border-b-4 border-orange-500">⚡ Urgency Level Distribution</h3>
            <div className="space-y-2 mb-6">
              {stats.urgencyStats.map((item, index) => (
                <div key={index} className="stat-item">
                  <span className="stat-label">{item.label}</span>
                  <span className="stat-value">{item.value}</span>
                </div>
              ))}
            </div>
            <DoughnutChart data={createChartData(stats.urgencyStats)} title="Urgency Level Distribution" />
          </div>

          {/* Status Distribution */}
          <div className="stat-card">
            <h3 className="text-xl font-semibold text-gray-800 mb-5 pb-2 border-b-4 border-blue-500">📍 Status Distribution</h3>
            <div className="space-y-2 mb-6">
              {stats.statusStats.map((item, index) => (
                <div key={index} className="stat-item">
                  <span className="stat-label">{item.label}</span>
                  <span className="stat-value">{item.value}</span>
                </div>
              ))}
            </div>
            <PieChart data={createChartData(stats.statusStats)} title="Status Distribution" />
          </div>
        </div>

        {/* Emergency Records Table */}
        <div className="px-8 pb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
              <h2 className="text-2xl font-semibold">📋 Emergency Records Summary</h2>
              <p className="text-gray-300 mt-1">Complete list of all emergency requests with detailed information</p>
            </div>

            {/* Search Bar */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search emergencies..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Search Results Counter */}
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      {getPaginatedData(data.data).totalItems}
                    </span>
                    {searchQuery && (
                      <span>
                        {' '}of {data.count} records
                      </span>
                    )}
                    {!searchQuery && (
                      <span> records</span>
                    )}
                  </div>
                  
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
              
              {/* Search Help Text */}
              <div className="mt-3 text-xs text-gray-500">
                Search across location, contact, urgency, status, needs, notes, and number of people
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th 
                      className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150 ${
                        sortField === 'numberOfPeople' 
                          ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' 
                          : 'text-gray-500'
                      }`}
                      onClick={() => handleSort('numberOfPeople')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>👥 People</span>
                        {sortField === 'numberOfPeople' && (
                          <span className="text-blue-500 font-bold">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150 ${
                        sortField === 'urgencyLevel' 
                          ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' 
                          : 'text-gray-500'
                      }`}
                      onClick={() => handleSort('urgencyLevel')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>⚡ Urgency</span>
                        {sortField === 'urgencyLevel' && (
                          <span className="text-blue-500 font-bold">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🛠️ Needs</th>
                    <th 
                      className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150 ${
                        sortField === 'timestamp' 
                          ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' 
                          : 'text-gray-500'
                      }`}
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>⏰ Timestamp</span>
                        {sortField === 'timestamp' && (
                          <span className="text-blue-500 font-bold">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150 ${
                        sortField === 'status' 
                          ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' 
                          : 'text-gray-500'
                      }`}
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>🚩 Status</span>
                        {sortField === 'status' && (
                          <span className="text-blue-500 font-bold">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getPaginatedData(data.data).data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No emergencies found</h3>
                          <p className="text-gray-500">
                            {searchQuery 
                              ? `No emergencies match your search for "${searchQuery}"`
                              : 'No emergency records available'
                            }
                          </p>
                          {searchQuery && (
                            <button
                              onClick={clearSearch}
                              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Clear Search
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    getPaginatedData(data.data).data.map((emergency, index) => {
                    const urgencyColor = {
                      'HIGH': 'bg-red-100 text-red-800 border-red-200',
                      'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-200',
                      'LOW': 'bg-green-100 text-green-800 border-green-200'
                    }[emergency.urgencyLevel] || 'bg-gray-100 text-gray-800 border-gray-200';

                    const statusColor = {
                      'pending': 'bg-orange-100 text-orange-800 border-orange-200',
                      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
                      'resolved': 'bg-green-100 text-green-800 border-green-200',
                      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
                    }[emergency.status] || 'bg-gray-100 text-gray-800 border-gray-200';

                    return (
                      <tr 
                        key={emergency.id} 
                        className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                        onClick={() => handleRowClick(emergency)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatLocation(emergency.placename, emergency.latitude, emergency.longitude)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-semibold">{emergency.numberOfPeople}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${urgencyColor}`}>
                            {emergency.urgencyLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {formatNeeds(emergency.needs)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatTimestamp(emergency.timestamp)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                            {emergency.status}
                          </span>
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {getPaginatedData(data.data).totalPages > 1 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Page Info */}
                  <div className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {Math.min((currentPage - 1) * itemsPerPage + 1, getPaginatedData(data.data).totalItems)}
                    </span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, getPaginatedData(data.data).totalItems)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">
                      {getPaginatedData(data.data).totalItems}
                    </span>
                    {' '}results
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const { totalPages, currentPage: page } = getPaginatedData(data.data);
                        const pages = [];
                        const maxVisiblePages = 5;
                        
                        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                        
                        if (endPage - startPage + 1 < maxVisiblePages) {
                          startPage = Math.max(1, endPage - maxVisiblePages + 1);
                        }

                        // Add first page and ellipsis if needed
                        if (startPage > 1) {
                          pages.push(
                            <button
                              key={1}
                              onClick={() => handlePageChange(1)}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              1
                            </button>
                          );
                          if (startPage > 2) {
                            pages.push(
                              <span key="ellipsis1" className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                        }

                        // Add visible page numbers
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`px-3 py-2 text-sm font-medium rounded-md ${
                                i === page
                                  ? 'text-white bg-blue-600 border border-blue-600'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }

                        // Add last page and ellipsis if needed
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(
                              <span key="ellipsis2" className="px-2 text-gray-500">
                                ...
                              </span>
                            );
                          }
                          pages.push(
                            <button
                              key={totalPages}
                              onClick={() => handlePageChange(totalPages)}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                              {totalPages}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === getPaginatedData(data.data).totalPages}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === getPaginatedData(data.data).totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-sm text-gray-700">
                  {searchQuery ? (
                    <>
                      Found <span className="font-medium">{getPaginatedData(data.data).totalItems}</span> of{' '}
                      <span className="font-medium">{data.count}</span> emergency records
                    </>
                  ) : (
                    <>
                      Total <span className="font-medium">{data.count}</span> emergency records
                    </>
                  )}
                </p>
                <div className="text-sm text-gray-500">
                  {cacheInfo?.lastUpdated && (
                    <p>
                      Data from: <span className="font-medium">
                        {new Date(cacheInfo.lastUpdated).toLocaleString()}
                      </span>
                    </p>
                  )}
                  {cacheInfo?.nextUpdate && (
                    <p>
                      Next update: <span className="font-medium">
                        {new Date(cacheInfo.nextUpdate).toLocaleString()}
                      </span>
                    </p>
                  )}
                  {cacheInfo && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <p><strong>Debug Info:</strong></p>
                      <p>Cache Source: {cacheInfo.cacheSource || 'unknown'}</p>
                      <p>Cached: {cacheInfo.cached ? 'Yes' : 'No'}</p>
                      {cacheInfo.debug && (
                        <>
                          <p>Environment: {cacheInfo.debug.environment || 'unknown'}</p>
                          <p>Time since last fetch: {cacheInfo.debug.timeSinceLastFetch || 'unknown'}s</p>
                          <p>Cache duration: {cacheInfo.debug.cacheDuration || 'unknown'}s</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Details Modal */}
      {showModal && selectedEmergency && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">🚨 Emergency Details</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="mt-6 space-y-6">
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
                    <p className="text-sm text-gray-700">{selectedEmergency.placename}</p>
                    <a 
                      href={`https://www.google.com/maps?q=${selectedEmergency.latitude},${selectedEmergency.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                    >
                      View on Map ({selectedEmergency.latitude.toFixed(4)}, {selectedEmergency.longitude.toFixed(4)})
                    </a>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">📞 Contact Number</h4>
                    <p className="text-sm text-gray-700 font-mono">{selectedEmergency.contactno}</p>
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
                    <h4 className="text-sm font-medium text-gray-900 mb-1">👥 Number of People Affected</h4>
                    <p className="text-sm text-gray-700 font-semibold text-lg">{selectedEmergency.numberOfPeople} people</p>
                  </div>
                </div>

                {/* Urgency Level */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">⚡ Urgency Level</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      selectedEmergency.urgencyLevel === 'HIGH' ? 'bg-red-100 text-red-800 border-red-200' :
                      selectedEmergency.urgencyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      {selectedEmergency.urgencyLevel}
                    </span>
                  </div>
                </div>

                {/* Needs */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">🛠️ Required Needs</h4>
                    {selectedEmergency.needs && selectedEmergency.needs.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedEmergency.needs.map((need, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {need}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No specific needs mentioned</p>
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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      selectedEmergency.status === 'pending' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                      selectedEmergency.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      selectedEmergency.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {selectedEmergency.status}
                    </span>
                  </div>
                </div>

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
                    <p className="text-sm text-gray-700">{formatTimestamp(selectedEmergency.timestamp)}</p>
                  </div>
                </div>

                {/* Additional Notes */}
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
                    {selectedEmergency.additionalNotes && selectedEmergency.additionalNotes.trim() !== '' ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 leading-relaxed">{selectedEmergency.additionalNotes}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No additional notes provided</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
