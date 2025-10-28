# Useful Commands & Scripts

> **Purpose**: Quick reference for frequently used commands, scripts, and workflows.
> **Update When**: New commands added, build process changes, or new scripts created.
> **Agent Instructions**: Reference before running operations. Update with new useful commands.

## Build & Development

### Build Project
```bash
# Command
[build command]

# What it does
[Explanation]

# Output
[What to expect]
```

### Run Development Server
```bash
# Command
[dev server command]

# Port
[Port number]

# Hot reload
[Yes/No]
```

### Run Tests
```bash
# All tests
[test command]

# Specific file
[test command for single file]

# With coverage
[test command with coverage]

# Watch mode
[test command in watch mode]
```

---

## Database Operations

### Run Migrations
```bash
# Apply migrations
[migration up command]

# Rollback
[migration down command]

# Create new migration
[create migration command]
```

### Seed Database
```bash
[seed command]
```

### Database Console
```bash
[db console command]
```

---

## Linting & Formatting

### Lint Code
```bash
# Check
[lint check command]

# Fix
[lint fix command]

# Specific files
[lint specific files]
```

### Format Code
```bash
# Format all
[format command]

# Check only
[format check command]
```

---

## Git Workflows

### Create Feature Branch
```bash
git checkout -b feature/[name]
# or
git checkout -b bugfix/[name]
```

### Sync with Main
```bash
git fetch origin
git rebase origin/main
```

### Clean Up Branches
```bash
# List merged branches
git branch --merged

# Delete local branch
git branch -d [branch-name]
```

---

## Package Management

### Install Dependencies
```bash
[install command]
```

### Add Dependency
```bash
# Production
[add prod dependency]

# Development
[add dev dependency]
```

### Update Dependencies
```bash
# Check outdated
[check outdated command]

# Update all
[update command]

# Update specific
[update specific package]
```

---

## Deployment

### Build for Production
```bash
[production build command]
```

### Deploy to [Environment]
```bash
[deploy command]
```

### Rollback
```bash
[rollback command]
```

---

## Debugging

### View Logs
```bash
# Application logs
[log command]

# Error logs
[error log command]

# Tail logs
[tail log command]
```

### Debug Mode
```bash
[debug command]
```

### Performance Profiling
```bash
[profiling command]
```

---

## Docker (if applicable)

### Build Image
```bash
docker build -t [image-name] .
```

### Run Container
```bash
docker run -p [port]:[port] [image-name]
```

### Docker Compose
```bash
# Start
docker-compose up

# Start detached
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f
```

---

## Custom Scripts

### Script: [Script Name]
**Location**: `path/to/script.sh`
**Purpose**: [What it does]

```bash
# Usage
./path/to/script.sh [args]

# Example
./path/to/script.sh --option value
```

**When to Use**:
[Context when this script is helpful]

---

### Script: [Another Script]
**Location**: `path/to/script`
**Purpose**:

```bash
# Usage
[command]
```

---

## Environment Setup

### First Time Setup
```bash
# 1. Clone repository
git clone [repo-url]

# 2. Install dependencies
[install command]

# 3. Setup environment
cp .env.example .env

# 4. Initialize database
[db init command]

# 5. Run migrations
[migration command]

# 6. Seed data (optional)
[seed command]

# 7. Start dev server
[dev command]
```

### Switch Environments
```bash
# Development
[command for dev]

# Staging
[command for staging]

# Production
[command for prod]
```

---

## Troubleshooting Commands

### Clear Cache
```bash
[clear cache command]
```

### Reset Database
```bash
[reset db command]
```

### Reinstall Dependencies
```bash
rm -rf node_modules package-lock.json
[install command]
```

### Check System Health
```bash
[health check command]
```

---

## Performance & Monitoring

### Run Benchmarks
```bash
[benchmark command]
```

### Check Bundle Size
```bash
[bundle analysis command]
```

### Memory Profiling
```bash
[memory profile command]
```

---

## Quick Aliases (if used)

```bash
alias [shortcut]="[full command]"
alias [another]="[command]"
```

**To add**: Add to `.bashrc`, `.zshrc`, or equivalent

---

## CI/CD Commands

### Trigger CI Build
```bash
[ci trigger command]
```

### View CI Status
```bash
[ci status command]
```

---

## Template
```markdown
### [Operation Name]
```bash
# Command
[actual command]

# What it does
[explanation]

# Options
-[flag]: [description]
```

**When to Use**:
[context]
```

---
*Last Updated: [Date] | Updated By: [Agent/Human name]*
