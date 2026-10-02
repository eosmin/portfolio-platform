export const API_VERSION_PREFIX = '/v1';

export const API_PATHS = {
  projects: `${API_VERSION_PREFIX}/projects`,
  blog: `${API_VERSION_PREFIX}/blog`,
  skills: `${API_VERSION_PREFIX}/skills`,
  languages: `${API_VERSION_PREFIX}/languages`,
  certifications: `${API_VERSION_PREFIX}/certifications`,
  experience: `${API_VERSION_PREFIX}/experience`,
  profile: `${API_VERSION_PREFIX}/profile`,
  socialLinks: `${API_VERSION_PREFIX}/social-links`,
  githubStats: `${API_VERSION_PREFIX}/github/stats`,
  contact: `${API_VERSION_PREFIX}/contact`,
  analyticsViews: `${API_VERSION_PREFIX}/analytics/views`,
  adminLogin: `${API_VERSION_PREFIX}/admin/auth/login`,
  adminContact: `${API_VERSION_PREFIX}/admin/contact`,
} as const;
