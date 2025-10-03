// Google Analytics utility functions

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Emergency dashboard specific events
export const trackEmergencyEvent = {
  // Track when user searches
  search: (query: string, resultCount: number) => {
    event({
      action: 'search',
      category: 'emergency_dashboard',
      label: `Query: ${query.substring(0, 50)}`,
      value: resultCount,
    });
  },

  // Track when user clicks on emergency record
  viewEmergencyDetails: (emergencyId: string, urgencyLevel: string) => {
    event({
      action: 'view_emergency_details',
      category: 'emergency_dashboard',
      label: `Urgency: ${urgencyLevel}`,
    });
  },

  // Track when user sorts table
  sortTable: (sortField: string, sortDirection: string) => {
    event({
      action: 'sort_table',
      category: 'emergency_dashboard',
      label: `${sortField}_${sortDirection}`,
    });
  },

  // Track pagination usage
  changePage: (pageNumber: number) => {
    event({
      action: 'change_page',
      category: 'emergency_dashboard',
      label: `Page ${pageNumber}`,
      value: pageNumber,
    });
  },

  // Track when user views map
  viewMap: (location: string) => {
    event({
      action: 'view_map',
      category: 'emergency_dashboard',
      label: location.substring(0, 50),
    });
  },

  // Track data refresh
  dataRefresh: (cacheSource: string, recordCount: number) => {
    event({
      action: 'data_refresh',
      category: 'emergency_dashboard',
      label: cacheSource,
      value: recordCount,
    });
  },
};
