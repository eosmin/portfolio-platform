// Adds enough projects through the admin API for the list to span two pages (page size 12).
// Runs before `next build`, so the prerendered pages already see them. Safe to re-run: an existing slug answers 409.
const { E2E_API_URL, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } = process.env;
const TOTAL_PROJECTS = 14;
const base = `${E2E_API_URL}/v1`;

async function request(path, body, token) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return response;
}

const login = await request('/admin/auth/login', {
  email: E2E_ADMIN_EMAIL,
  password: E2E_ADMIN_PASSWORD,
});
if (!login.ok) throw new Error(`E2E admin login failed: ${login.status}`);
const { token } = await login.json();

for (let n = 1; n <= TOTAL_PROJECTS; n += 1) {
  const created = await request(
    '/admin/projects',
    {
      slug: `e2e-project-${String(n).padStart(2, '0')}`,
      title: `E2E Project ${n}`,
      description: `Generated project ${n} for pagination checks.`,
      body: `Body of generated project ${n}.`,
      repoUrl: null,
      demoUrl: null,
      coverImage: null,
      tech: ['E2E'],
      featured: false,
      publishedAt: new Date(Date.UTC(2024, 0, n)).toISOString(),
    },
    token,
  );
  if (!created.ok && created.status !== 409) {
    throw new Error(`Creating project ${n} failed: ${created.status} ${await created.text()}`);
  }
}
