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

Settings → Rules → Rulesets → New ruleset → **New branch ruleset**:

- Ruleset name: `protect-main`
- Enforcement status: **Active** (not _Disabled_ or _Evaluate_)
- Bypass list: empty
- Target branches → **Add target** → **Include default branch** (`main`). Alternative: **Include by pattern** → `main`. Without a target the ruleset applies to nothing.
- Branch rules to tick:

- Restrict deletions
- Block force pushes
- Require linear history
- Require a pull request before merging (allowed merge methods: **Squash** only)
- Require status checks to pass — **added later, after Phase 15** (TDD step 62): GitHub only offers a check for selection once it has run, so merge the CI PR, let the workflows run green once, then add the job names (`api`, `site`, `shared`, `compose-smoke`, `repo` jobs, as listed in the Phase 15 hand-over) here. Until then the ruleset is PR-only without required checks
- Do **not** add the owner's admin role (or anyone) to the bypass list

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
