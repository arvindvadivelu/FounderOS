import type { IntegrationConfig, ExternalSyncItem } from '../types';
import type { IntegrationAdapter, TestConnectionResult, SyncResult } from './types';
import { sanitizeExternalText } from './sanitizer';

export class GitHubAdapter implements IntegrationAdapter {
  provider = 'github' as const;

  private getHeaders(token: string) {
    return {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  async testConnection(config: IntegrationConfig): Promise<TestConnectionResult> {
    const token = config.apiKeyOrToken;
    if (!token || !token.trim()) {
      return {
        success: false,
        message: 'GitHub Personal Access Token is required.',
      };
    }

    const tStart = performance.now();
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: this.getHeaders(token),
      });

      const latencyMs = Math.round(performance.now() - tStart);
      const remaining = res.headers.get('x-ratelimit-remaining');
      const rateLimitReset = res.headers.get('x-ratelimit-reset');

      if (res.status === 401) {
        return {
          success: false,
          message: 'Invalid or expired GitHub token. Please verify your Personal Access Token scopes (repo, read:user).',
          latencyMs,
        };
      }

      if (res.status === 403 || res.status === 429) {
        return {
          success: false,
          message: 'GitHub API rate limit exceeded. Please wait or use an authenticated token.',
          rateLimitRemaining: remaining ? parseInt(remaining, 10) : 0,
          latencyMs,
        };
      }

      if (!res.ok) {
        return {
          success: false,
          message: `GitHub API error (HTTP ${res.status}): ${res.statusText}`,
          latencyMs,
        };
      }

      const userData = await res.json();
      const accountLabel = userData.name ? `${userData.login} (${userData.name})` : userData.login;

      return {
        success: true,
        message: `Successfully connected to GitHub as @${userData.login}`,
        accountLabel,
        latencyMs,
        rateLimitRemaining: remaining ? parseInt(remaining, 10) : undefined,
        rateLimitReset: rateLimitReset ? new Date(parseInt(rateLimitReset, 10) * 1000).toISOString() : undefined,
        details: {
          public_repos: userData.public_repos,
          total_private_repos: userData.total_private_repos,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Network failure connecting to GitHub API: ${err?.message || 'Check your internet connection'}`,
        latencyMs: Math.round(performance.now() - tStart),
      };
    }
  }

  async sync(config: IntegrationConfig, lastSyncedAt?: string): Promise<SyncResult> {
    const token = config.apiKeyOrToken;
    if (!token) {
      return {
        success: false,
        items: [],
        itemsCount: 0,
        error: 'Missing GitHub Personal Access Token',
      };
    }

    const items: ExternalSyncItem[] = [];
    const nowIso = new Date().toISOString();

    try {
      // 1. Fetch user repositories (recent updated first)
      const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=8', {
        headers: this.getHeaders(token),
      });

      if (!reposRes.ok) {
        if (reposRes.status === 401) throw new Error('Invalid or expired GitHub token');
        if (reposRes.status === 403 || reposRes.status === 429) throw new Error('GitHub API rate limit reached');
        throw new Error(`Failed to fetch repositories (HTTP ${reposRes.status})`);
      }

      const repos: any[] = await reposRes.json();
      const selectedRepos = config.selectedRepos?.length
        ? repos.filter((r) => config.selectedRepos!.includes(r.name) || config.selectedRepos!.includes(r.full_name))
        : repos.slice(0, 4);

      // Track Repositories
      for (const repo of repos.slice(0, 8)) {
        items.push({
          id: `github_repo_${repo.id}`,
          integrationId: 'github',
          provider: 'github',
          itemType: 'repo',
          externalId: String(repo.id),
          title: sanitizeExternalText(repo.full_name || repo.name),
          summary: sanitizeExternalText(repo.description || 'No description'),
          status: repo.private ? 'private' : 'public',
          url: repo.html_url,
          timestamp: repo.updated_at || repo.pushed_at || nowIso,
          metadata: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            openIssues: repo.open_issues_count,
            language: repo.language,
            defaultBranch: repo.default_branch,
          },
          lastSyncedAt: nowIso,
        });
      }

      // 2. Fetch Issues and PRs for active repos
      for (const repo of selectedRepos) {
        const owner = repo.owner?.login || repo.full_name.split('/')[0];
        const repoName = repo.name;

        // Fetch issues & PRs
        try {
          const issuesRes = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/issues?state=all&per_page=12&sort=updated`,
            { headers: this.getHeaders(token) }
          );

          if (issuesRes.ok) {
            const issueList: any[] = await issuesRes.json();
            for (const issue of issueList) {
              const isPr = Boolean(issue.pull_request);
              items.push({
                id: `github_${isPr ? 'pr' : 'issue'}_${issue.id}`,
                integrationId: 'github',
                provider: 'github',
                itemType: isPr ? 'pull_request' : 'issue',
                externalId: String(issue.id),
                title: `[#${issue.number}] ${sanitizeExternalText(issue.title)}`,
                summary: sanitizeExternalText(issue.body || ''),
                status: issue.state,
                author: sanitizeExternalText(issue.user?.login || 'unknown'),
                url: issue.html_url,
                timestamp: issue.updated_at || issue.created_at || nowIso,
                metadata: {
                  number: issue.number,
                  repo: repo.full_name,
                  commentsCount: issue.comments,
                  labels: (issue.labels || []).map((l: any) => (typeof l === 'string' ? l : l.name)),
                  isDraft: issue.draft || false,
                },
                lastSyncedAt: nowIso,
              });
            }
          }
        } catch {
          // Continue syncing other repos if one fails
        }

        // Fetch Commits
        try {
          const commitsRes = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=6`,
            { headers: this.getHeaders(token) }
          );

          if (commitsRes.ok) {
            const commitList: any[] = await commitsRes.json();
            for (const c of commitList) {
              const commitMsg = c.commit?.message || '';
              const firstLine = commitMsg.split('\n')[0];
              items.push({
                id: `github_commit_${c.sha}`,
                integrationId: 'github',
                provider: 'github',
                itemType: 'commit',
                externalId: c.sha,
                title: sanitizeExternalText(firstLine),
                summary: sanitizeExternalText(commitMsg),
                status: 'committed',
                author: sanitizeExternalText(c.author?.login || c.commit?.author?.name || 'developer'),
                url: c.html_url,
                timestamp: c.commit?.author?.date || nowIso,
                metadata: {
                  repo: repo.full_name,
                  sha: c.sha.slice(0, 7),
                },
                lastSyncedAt: nowIso,
              });
            }
          }
        } catch {
          // Ignore commit error on single repo
        }
      }

      return {
        success: true,
        items,
        itemsCount: items.length,
        syncSummary: `Successfully synchronized ${items.length} items from GitHub (${repos.length} repositories).`,
      };
    } catch (err: any) {
      return {
        success: false,
        items: [],
        itemsCount: 0,
        error: err?.message || 'Failed to complete GitHub sync',
      };
    }
  }
}
