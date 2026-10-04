import { z } from 'zod';

const GITHUB_API = 'https://api.github.com';
const REPOS_PAGE_SIZE = 100;
const MAX_REPO_PAGES = 10;
const REQUEST_TIMEOUT_MS = 5000;

const userSchema = z.object({
  login: z.string().min(1),
  html_url: z.url(),
  public_repos: z.number().int().min(0),
  created_at: z.iso.datetime(),
});

const repoSchema = z.object({
  language: z.string().nullable(),
  pushed_at: z.iso.datetime().nullable(),
});

export type GithubUser = z.infer<typeof userSchema>;
export type GithubRepo = z.infer<typeof repoSchema>;

export interface GithubClient {
  getUser(username: string): Promise<GithubUser>;
  /** The user's own public repositories, across pages. */
  getPublicRepos(username: string): Promise<GithubRepo[]>;
}

export function createGithubClient({ token }: { token: string }): GithubClient {
  async function get<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
    const res = await fetch(`${GITHUB_API}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'portfolio-platform-api',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`GitHub ${path} answered ${res.status}`);
    // The body is parsed (not trusted): GitHub is an external boundary.
    return schema.parse(await res.json());
  }

  return {
    getUser: (username) => get(`/users/${encodeURIComponent(username)}`, userSchema),
    async getPublicRepos(username) {
      const repos: GithubRepo[] = [];
      for (let page = 1; page <= MAX_REPO_PAGES; page += 1) {
        const batch = await get(
          `/users/${encodeURIComponent(username)}/repos?type=owner&per_page=${REPOS_PAGE_SIZE}&page=${page}`,
          z.array(repoSchema),
        );
        repos.push(...batch);
        if (batch.length < REPOS_PAGE_SIZE) break;
      }
      return repos;
    },
  };
}
