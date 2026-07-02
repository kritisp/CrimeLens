import { mockCases, mockStats, mockAlerts, mockRecentFindings, mockCopilotChat } from '../data/cases';
import { mockChatResponses, defaultResponse } from '../data/chat';
import { mockNodes, mockLinks } from '../data/network';
import { mockDistricts, mockHotspots } from '../data/heatmap';
import { mockInvestigationReport, mockDistrictReport, mockTrendReport, mockTimelineReport } from '../data/reports';
import { mockPatternData } from '../data/patterns';

/**
 * CrimeLens AI - Mock API Service client
 * Simulates network requests and latency so components can fetch data asynchronously.
 * Swapping to a real backend later will only require changing this file.
 */
export const api = {
  get: (url) => {
    return new Promise((resolve, reject) => {
      // Simulate real-world network latency (400ms) for professional responsiveness
      setTimeout(() => {
        try {
          if (url === '/stats') {
            resolve({ data: mockStats });
          } else if (url === '/alerts') {
            resolve({ data: mockAlerts });
          } else if (url === '/cases') {
            resolve({ data: mockCases });
          } else if (url === '/recent-findings') {
            resolve({ data: mockRecentFindings });
          } else if (url === '/network/nodes') {
            resolve({ data: mockNodes });
          } else if (url === '/network/links') {
            resolve({ data: mockLinks });
          } else if (url === '/heatmap/districts') {
            resolve({ data: mockDistricts });
          } else if (url === '/heatmap/hotspots') {
            resolve({ data: mockHotspots });
          } else if (url === '/reports/investigation') {
            resolve({ data: mockInvestigationReport });
          } else if (url === '/reports/district') {
            resolve({ data: mockDistrictReport });
          } else if (url === '/reports/trend') {
            resolve({ data: mockTrendReport });
          } else if (url === '/reports/timeline') {
            resolve({ data: mockTimelineReport });
          } else if (url.startsWith('/cases/')) {
            const id = url.split('/').pop();
            const matchingCase = mockCases.find(c => c.id === id) || mockCases[0];
            resolve({ data: matchingCase });
          } else if (url.startsWith('/pattern/')) {
            const id = url.split('/').pop();
            const pattern = mockPatternData[id] || mockPatternData["FIR-1024"];
            resolve({ data: pattern });
          } else if (url === '/copilot/chat') {
            resolve({ data: mockCopilotChat });
          } else {
            resolve({ data: null });
          }
        } catch (error) {
          reject(error);
        }
      }, 400);
    });
  },

  post: (url, body) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (url === '/chat/query') {
          const queryText = body?.query || '';
          // Search for query match
          const matchingKey = Object.keys(mockChatResponses).find(
            key => key.toLowerCase() === queryText.toLowerCase() || queryText.toLowerCase().includes(key.toLowerCase())
          );
          
          if (matchingKey) {
            resolve({ data: mockChatResponses[matchingKey] });
          } else {
            resolve({ data: defaultResponse });
          }
        } else {
          resolve({ data: { success: true, timestamp: new Date().toISOString() } });
        }
      }, 600); // 600ms latency for AI thinking feels highly realistic!
    });
  }
};
