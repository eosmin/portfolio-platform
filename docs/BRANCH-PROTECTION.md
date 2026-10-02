# Branch protection for `main`

`main` changes only through a pull request that the owner reviews and **squash-merges** on GitHub (TDD §6.1). This file lists the safeguards that enforce it. The agent never edits these settings.

## Local (already in the repo)

| Hook                      | Effect                                                            |
| ------------------------- | ----------------------------------------------------------------- |
| `.husky/pre-commit`       | refuses `git commit` while on `main` (via `.husky/guard-main.sh`) |
| `.husky/pre-merge-commit` | refuses `git merge` that would create a commit on `main`          |
| `.husky/pre-push`         | refuses any push whose remote ref is `refs/heads/main`            |

They are installed by `pnpm install` (husky `prepare`). They can be skipped with `--no-verify`, so they are a guard rail, not a security boundary — the remote ruleset below is the real one.

Optional per-clone hardening (not versioned):

```bash
# Fast-forward-only pulls: a local `git pull` on main can never create a merge commit
git config pull.ff only
# Never push main by accident, even with a bare `git push`
git config remote.origin.push 'HEAD'            # push current branch only
git config push.default current
```

## Remote (owner, once, GitHub repo `eosmin/portfolio-platform`)

Settings → Rules → Rulesets → New branch ruleset, target `main`, enforcement **Active**:

- Restrict deletions
- Block force pushes
- Require linear history
- Require a pull request before merging (allowed merge methods: **Squash** only)
- Require status checks to pass (add the CI jobs once Phase 15 creates them)
- Bypass list: **empty** (do not add the owner's admin role)

Repo Settings → General → Pull Requests: enable **Allow squash merging** only, set default commit message to **Pull request title**, enable **Automatically delete head branches**.

Same ruleset from the CLI (review before running):

```bash
gh api -X POST repos/eosmin/portfolio-platform/rulesets --input - <<'JSON'
{
  "name": "protect-main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["squash"]
      }
    }
  ]
}
JSON

gh api -X PATCH repos/eosmin/portfolio-platform \
  -f allow_squash_merge=true -f allow_merge_commit=false -f allow_rebase_merge=false \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY \
  -f delete_branch_on_merge=true
```

`required_approving_review_count` is 0 because the repo has a single owner (GitHub does not let authors approve their own PR); the PR itself, plus the empty bypass list, is what blocks direct pushes.

## Verify

```bash
git switch main && git commit --allow-empty -m "chore: test"   # blocked by pre-commit
git push origin HEAD:main                                        # blocked locally by pre-push, and by the ruleset on GitHub
```
