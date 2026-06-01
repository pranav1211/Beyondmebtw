# SSH and VS Code Remote-SSH Setup Notes

This is the working setup for connecting from this Windows machine to the BeyondMe servers with SSH and VS Code Remote-SSH.

## Local Windows SSH Config

File:

```text
C:\Users\pranav\.ssh\config
```

Useful host entries:

```sshconfig
Host knowledge-graph-weaviate
  HostName 64.227.159.54
  User root
  IdentityFile ~/.ssh/id_rsa
  IdentitiesOnly yes

Host beyondmebtw
  HostName beyondmebtw.com
  User pvr
  IdentityFile ~/.ssh/id_rsa
  IdentitiesOnly yes

Host beyondme-content
  HostName content.beyondmebtw.com
  User pranav
  IdentityFile ~/.ssh/id_rsa
  IdentitiesOnly yes
```

Connect from PowerShell:

```powershell
ssh beyondmebtw
ssh beyondme-content
ssh knowledge-graph-weaviate
```

## Local Key

Public key file:

```text
C:\Users\pranav\.ssh\id_rsa.pub
```

Show/copy the public key:

```powershell
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub
```

Fingerprint:

```powershell
ssh-keygen -lf $env:USERPROFILE\.ssh\id_rsa.pub
```

## Windows SSH File Permissions

OpenSSH on Windows rejects SSH config/key files if another normal Windows user can read/write them.

Good permissions should include only:

```text
DESKTOP-72JHNHR\pranav
NT AUTHORITY\SYSTEM
BUILTIN\Administrators
```

Fix `.ssh`, config, and key permissions:

```powershell
$ssh = Join-Path $env:USERPROFILE '.ssh'
$user = "${env:COMPUTERNAME}\${env:USERNAME}:F"

icacls $ssh /inheritance:r /grant:r $user "SYSTEM:F" "Administrators:F"
icacls (Join-Path $ssh 'config') /inheritance:r /grant:r $user "SYSTEM:F" "Administrators:F"
icacls (Join-Path $ssh 'id_rsa') /inheritance:r /grant:r $user "SYSTEM:F" "Administrators:F"
icacls (Join-Path $ssh 'id_rsa.pub') /inheritance:r /grant:r $user "SYSTEM:F" "Administrators:F"
```

Check permissions:

```powershell
Get-Acl $env:USERPROFILE\.ssh\config | Format-List Owner,AccessToString
```

## Server Authorized Keys

Each server user must have this Windows machine's public key in:

```text
~/.ssh/authorized_keys
```

One key per line. No commas, quotes, or extra characters.

Example:

```text
ssh-ed25519 AAAAC3... existing-key
ssh-rsa AAAAB3... pranavisda1@gmail.com
```

## Server Permissions

For `pvr@beyondmebtw.com`:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod go-w ~
```

If logged in as another sudo user:

```bash
sudo mkdir -p /home/pvr/.ssh
sudo nano /home/pvr/.ssh/authorized_keys
sudo chown -R pvr:pvr /home/pvr/.ssh
sudo chown pvr:pvr /home/pvr
sudo chmod 700 /home/pvr/.ssh
sudo chmod 600 /home/pvr/.ssh/authorized_keys
sudo chmod go-w /home/pvr
```

For `pranav@content.beyondmebtw.com`:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod go-w ~
```

Or with sudo:

```bash
sudo mkdir -p /home/pranav/.ssh
sudo nano /home/pranav/.ssh/authorized_keys
sudo chown -R pranav:pranav /home/pranav/.ssh
sudo chown pranav:pranav /home/pranav
sudo chmod 700 /home/pranav/.ssh
sudo chmod 600 /home/pranav/.ssh/authorized_keys
sudo chmod go-w /home/pranav
```

## Install Local Key on Server

If password login works, install the local public key with:

```powershell
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh pvr@beyondmebtw.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && chmod go-w ~"
```

For content:

```powershell
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh pranav@content.beyondmebtw.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys && chmod go-w ~"
```

## Debug SSH

Check what SSH is doing:

```powershell
ssh -v beyondmebtw
ssh -v beyondme-content
```

Non-interactive test:

```powershell
ssh -o BatchMode=yes beyondmebtw exit
```

Look for:

```text
Offering public key
Server accepts key
Authenticated to
Permission denied
```

If it says `Server accepts key`, key auth is working.

If it says `Permission denied`, the server likely does not have the public key or has bad `.ssh` permissions.

## Stale Host Key Fix

If SSH says:

```text
WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED
Host key verification failed
```

Only do this if the server was rebuilt, reinstalled, or the host key change is expected:

```powershell
ssh-keygen -R beyondmebtw.com
ssh-keygen -R 167.71.230.251
```

Then reconnect:

```powershell
ssh beyondmebtw
```

Type `yes` when asked to trust the new host key.

## VS Code Remote-SSH

Connect with:

```text
Ctrl+Shift+P -> Remote-SSH: Connect to Host... -> beyondmebtw
Ctrl+Shift+P -> Remote-SSH: Connect to Host... -> beyondme-content
```

On small servers, disable heavy extensions on the remote side:

```text
Extensions -> Disable in SSH: beyondmebtw
```

Remote settings worth using:

```json
{
  "files.watcherExclude": {
    "**/.git/**": true,
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/.next/**": true,
    "**/coverage/**": true,
    "**/logs/**": true,
    "**/*.log": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true,
    "**/coverage": true,
    "**/logs": true
  },
  "git.autofetch": false,
  "git.autoRepositoryDetection": false,
  "typescript.tsserver.enabled": false,
  "javascript.suggest.autoImports": false,
  "typescript.suggest.autoImports": false,
  "npm.autoDetect": "off",
  "task.autoDetect": "off",
  "debug.javascript.autoAttachFilter": "disabled"
}
```

If VS Code server goes wild:

```bash
pkill -u pvr -f vscode-server
pkill -u pvr -f ".vscode-server"
```

If needed, remove the remote VS Code server and let it reinstall:

```bash
rm -rf /home/pvr/.vscode-server
```

## Swap on Small Servers

For a 1 vCPU / 1 GB RAM server, swap helps prevent crashes during memory spikes.

Create 1 GB swap:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

Swap is not real RAM. It is slower disk-backed overflow memory.

## System Info Commands

Overview:

```bash
hostnamectl
uptime
```

CPU:

```bash
lscpu
nproc
cat /proc/cpuinfo | grep "model name" | head -1
```

RAM and swap:

```bash
free -h
```

Storage:

```bash
df -h
lsblk
```

Processes:

```bash
htop
top
ps aux --sort=-%cpu | head -20
ps aux --sort=-%mem | head -20
```

Disk usage:

```bash
du -sh *
```
