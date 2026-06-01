# Accidental Commit Cleanup

Use this when a file was committed by mistake and should be removed from the repository.

## 1. Check What Happened

Check current branch status:

```bash
git status --short --branch
```

Check recent commits:

```bash
git log --oneline -5
```

Check what the latest commit changed:

```bash
git show --name-status --format=oneline --no-renames HEAD
```

## 2. If the Commit Has Not Been Pushed

If the accidental commit is only local and is the latest commit, remove it:

```bash
git reset --hard HEAD~1
```

This deletes the latest local commit and restores the branch to the previous commit.

## 3. If the Commit Was Already Pushed

If the commit was already pushed and force-push is blocked or undesirable, make a normal cleanup commit:

```bash
git rm path/to/accidental-file
git commit -m "remove accidental file"
git push origin main
```

This removes the file from the current branch tip.

Important: this does not remove the file from Git history. It only removes it from the latest version of the branch.

## 4. If the File Must Be Removed From History

Only do this when necessary, such as when secrets, private keys, tokens, or sensitive infrastructure details were committed.

If the bad commit is the latest commit and force-push is allowed:

```bash
git reset --hard <safe-commit-before-bad-commit>
git push --force-with-lease origin main
```

Use `--force-with-lease` instead of plain `--force`. It refuses to overwrite remote changes you do not have locally.

If the branch is protected, temporarily update the repository branch rules to allow force-pushes, run the command, then re-enable the protection.

## 5. Drop a Commit From the Middle

Use this when the bad commit is not the latest commit, and there are newer commits after it that should be kept.

Example history:

```text
A -- B -- C -- D main
     ^
     bad commit
```

To remove `B` but keep `C` and `D`, rebase everything after `B` onto `A`:

```bash
git rebase --onto <commit-before-bad-commit> <bad-commit> main
```

Generic form:

```bash
git rebase --onto <new-base> <upstream-to-drop-through> <branch>
```

What it means:

```text
Take commits after <upstream-to-drop-through> from <branch>
Replay them onto <new-base>
```

In the simple one-bad-commit case:

```bash
git rebase --onto A B main
```

Result:

```text
A -- C' -- D' main
```

If there is also a later cleanup commit that only reverses the bad commit, drop both the bad commit and the cleanup commit:

```bash
git rebase --onto <commit-before-bad-add> <cleanup-commit> main
```

Then update the remote if history rewriting is allowed:

```bash
git push --force-with-lease origin main
```

If force-push is blocked, change the branch protection/rules first.

## 6. After Cleanup

Verify:

```bash
git status --short --branch
git log --oneline -5
```

Check whether the file still exists at the current branch tip:

```bash
test -e path/to/accidental-file && echo "still exists" || echo "removed"
```

On PowerShell:

```powershell
Test-Path path/to/accidental-file
```

## 7. If Secrets Were Committed

Removing a commit is not enough if a real secret was exposed.

Rotate or revoke the leaked secret immediately:

```text
API keys
SSH private keys
Database passwords
Access tokens
Webhook secrets
Cloud credentials
```

For SSH private keys, generate a new keypair and remove the old public key from all `authorized_keys` files.

## 8. What Happened In This Case

The cleanup flow was:

```bash
git status --short --branch
git log --oneline -5
git show --name-status --format=oneline --no-renames HEAD
git reset --hard HEAD~1
git push --force-with-lease origin main
```

The force-push was blocked by repository rules, so the fallback was:

```bash
git fetch origin main
git reset --hard origin/main
git rm path/to/accidental-file
git commit -m "remove accidental file"
git push origin main
```

Result:

```text
The file was removed from the current branch tip.
The original commit remained in history because force-push was blocked.
```

Later, after newer commits had been added, the local history was cleaned by dropping the bad add commit and its later remove commit while keeping the newer work:

```bash
git rebase --onto <commit-before-bad-add> <cleanup-commit> main
```

The final remote update still required force-push permission:

```bash
git push --force-with-lease origin main
```
