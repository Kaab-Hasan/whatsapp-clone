import { ApiError } from '@/types';

interface FetcherOptions extends RequestInit {
  params?: Record<string, string>;
}

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

// Base API URL
const API_BASE = '/api';

// Helper function to build URL with query parameters
function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${window.location.origin}${API_BASE}${path}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
}

// Generic fetch wrapper
async function fetcher<T>(
  path: string,
  options: FetcherOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  // Default headers
  const headers = new Headers(options.headers || {});
  
  // Set JSON content type if not specified and there's a body
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Build the URL with any query parameters
  const url = buildUrl(path, params);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Include cookies for authentication
    });
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') === -1) {
      if (!response.ok) {
        throw new HttpError('Server error', response.status);
      }
      return response as unknown as T;
    }
    
    // Parse JSON response
    const data = await response.json();
    
    // Handle error responses
    if (!response.ok) {
      const error = data as ApiError;
      throw new HttpError(error.message || 'Server error', response.status);
    }
    
    return data as T;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError((error as Error).message || 'Network error', 500);
  }
}

// HTTP method wrappers
export const api = {
  get: <T>(path: string, options?: FetcherOptions) => 
    fetcher<T>(path, { ...options, method: 'GET' }),
  
  post: <T>(path: string, body: any, options?: FetcherOptions) => 
    fetcher<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  
  put: <T>(path: string, body: any, options?: FetcherOptions) => 
    fetcher<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  
  patch: <T>(path: string, body: any, options?: FetcherOptions) => 
    fetcher<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  
  delete: <T>(path: string, options?: FetcherOptions) => 
    fetcher<T>(path, { ...options, method: 'DELETE' }),
};

export default api; 