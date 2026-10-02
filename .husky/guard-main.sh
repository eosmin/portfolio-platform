#!/bin/sh
# Refuses the git operation when the current branch is main. main only changes
# through a GitHub pull request squash-merged by the owner (docs/TDD.md §6.1, §6.5).
if [ "$(git symbolic-ref --short -q HEAD)" = "main" ]; then
  echo "BLOCKED: direct commits/merges on 'main' are not allowed. Create a branch, push it and open a PR." >&2
  exit 1
fi
