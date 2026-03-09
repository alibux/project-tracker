# Project Tracker App — MVP Specification

## Purpose
A personal general-purpose project management tool with a Kanban board, GitHub integration, and Telegram daily digests. Solo user, local development only, no authentication required for MVP.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, shadcn-ui, dnd-kit |
| Backend | ASP.NET Core 8, EF Core 8, PostgreSQL 16 |
| CI/CD | GitHub Actions |
| Notifications | Telegram Bot API |
| GitHub Integration | GitHub Webhooks |

---

## Data Models

### Project
```
id            uuid          primary key, auto-generated
name          string        required
description   string        nullable
createdAt     datetime      auto-set
updatedAt     datetime      auto-updated
```

### Sprint
```
id            uuid          primary key, auto-generated
projectId     uuid          foreign key → Project
name          string        required
startDate     date          nullable
endDate       date          nullable
isActive      bool          default false
createdAt     datetime      auto-set
updatedAt     datetime      auto-updated
```
- Only one sprint per project may have `isActive = true` at a time
- Enforced at the API layer

### Task
```
id              uuid        primary key, auto-generated
projectId       uuid        foreign key → Project, required
sprintId        uuid        foreign key → Sprint, nullable
title           string      required
priority        enum        low | medium | high | urgent
type            enum        feature | bug | chore | spike
assignee        string      nullable
column          enum        Backlog | InProgress | InReview | Done
position        int         required, used for ordering within column
githubPrUrl     string      nullable
githubIssueUrl  string      nullable
createdAt       datetime    auto-set
updatedAt       datetime    auto-updated
```
- `position` uses numeric spacing (e.g. 1000, 2000, 3000)
- Backend rebalances positions on collision
- Enum values stored as strings in the database

### Settings (singleton — one row)
```
id                    uuid      primary key
defaultProjectId      uuid      nullable, FK → Project
telegramChatId        string    nullable
digestTime            string    default "09:00" (HH:mm local time)
githubWebhookSecret   string    nullable
```

---

## API Endpoints

### Projects
| Method | Path | Description |
|---|---|---|
| GET | /api/projects | List all projects |
| POST | /api/projects | Create a project |
| PUT | /api/projects/:id | Update a project |
| DELETE | /api/projects/:id | Delete a project and its tasks/sprints |

### Sprints
| Method | Path | Description |
|---|---|---|
| GET | /api/projects/:projectId/sprints | List sprints for a project |
| POST | /api/projects/:projectId/sprints | Create a sprint |
| PUT | /api/sprints/:id | Update a sprint |
| DELETE | /api/sprints/:id | Delete a sprint |
| POST | /api/sprints/:id/activate | Set sprint as active (deactivates others) |

### Tasks
| Method | Path | Description |
|---|---|---|
| GET | /api/tasks | List tasks (query params: projectId, sprintId) |
| GET | /api/tasks/:id | Get a single task |
| POST | /api/tasks | Create a task |
| PUT | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |
| PATCH | /api/tasks/:id/move | Move task: body `{ column, position }` |

### Settings
| Method | Path | Description |
|---|---|---|
| GET | /api/settings | Get current settings |
| PUT | /api/settings | Update settings |

### Webhooks
| Method | Path | Description |
|---|---|---|
| POST | /api/webhooks/github | Receive GitHub webhook events |

---

## API Conventions
- All responses use JSON
- Errors follow RFC 7807 (Problem Details): `{ type, title, status, detail }`
- All timestamps returned as ISO 8601 UTC strings
- Enum values returned as strings (not integers)
- Pagination not required for MVP (return all records)

---

## Features

### 1. Kanban Board

**Display:**
- Four columns rendered side by side: Backlog, In Progress, In Review, Done
- Each column shows its task cards in ascending `position` order
- Task card displays: title, priority badge (color-coded), type badge, assignee (if set)
- If a task has a linked GitHub PR or issue URL, show a GitHub icon on the card linking to it
- Column header shows task count

**Drag and Drop:**
- Users can drag task cards between columns and reorder within a column
- Uses dnd-kit for drag and drop
- Keyboard accessible: Space to lift, Arrow keys to move, Enter to drop, Escape to cancel
- Optimistic UI update — card moves immediately, API call happens in background
- On API failure: revert card to original position and show error toast

**Filtering:**
- Project selector (dropdown or sidebar) — board shows tasks for selected project only
- Sprint filter — show active sprint tasks only, or all tasks
- Default: selected project + active sprint (if one exists)

---

### 2. Task Management

**Task Card Actions:**
- Click card to open task detail modal
- Right-click or kebab menu: Delete task (with confirmation)

**Task Detail Modal (Create / Edit):**
- Fields:
  - Title (text input, required)
  - Priority (select: low / medium / high / urgent)
  - Type (select: feature / bug / chore / spike)
  - Assignee (text input, nullable)
  - Column (select: Backlog / In Progress / In Review / Done)
  - Sprint (select from project's sprints, nullable)
- Create mode: opened via "Add Task" button on a column
- Edit mode: opened by clicking an existing task card
- Save button calls POST /api/tasks or PUT /api/tasks/:id
- Cancel closes modal without saving
- Show success toast on save, error toast on failure

---

### 3. Projects

**Project Sidebar / Switcher:**
- List of all projects shown in sidebar or top navigation
- Click a project to switch the board to that project
- "New Project" button opens a create modal (name + optional description)
- Project actions: rename, delete (with confirmation — warns that all tasks/sprints will be deleted)

---

### 4. Sprints

**Sprint Management Panel:**
- Accessible via a "Sprints" button or tab within a project view
- List of sprints for the current project (name, dates, active status)
- Create sprint: name, optional start date, optional end date
- Edit sprint: update name and dates
- Delete sprint: tasks in sprint become unassigned (sprintId set to null)
- Activate sprint: marks sprint as active, deactivates any currently active sprint
- Only one sprint can be active per project at a time

---

### 5. GitHub Integration

**Webhook Receiver:**
- Endpoint: `POST /api/webhooks/github`
- Validates `X-Hub-Signature-256` header using `githubWebhookSecret` from Settings
- Rejects requests with invalid signatures (HTTP 401)
- Processes only supported event types, ignores others silently

**Supported Events:**

| GitHub Event | Condition | Action |
|---|---|---|
| `issues.opened` | Any | Create task: title = issue title, type = bug (if labeled "bug") else feature, column = Backlog, githubIssueUrl = issue URL |
| `pull_request.opened` | Any | Create task: title = PR title, type = feature, column = InProgress, githubPrUrl = PR URL |
| `pull_request.closed` | `merged: true` | Find task where githubPrUrl matches PR URL → move to Done column |

**Task Creation from Webhooks:**
- New tasks created from GitHub events are assigned to `defaultProjectId` from Settings
- If `defaultProjectId` is not set, webhook events are ignored (log a warning)
- New tasks are not assigned to any sprint (sprintId = null)
- Position is set to end of column (highest existing position + 1000)

---

### 6. Telegram Notifications

**Daily Digest:**
- Sent once per day at the time configured in Settings (`digestTime`, default 09:00)
- Scheduled via a background service (hosted service in ASP.NET Core)
- Uses Telegram Bot API to send message to `telegramChatId` from Settings
- If `telegramChatId` is not configured, digest is skipped silently

**Digest Scope:**
- If active sprint exists for `defaultProjectId`: show tasks in that sprint only
- Otherwise: show all tasks for `defaultProjectId`
- If `defaultProjectId` is not set: skip digest

**Digest Format:**
```
📋 Daily Digest — [Day, DD Mon YYYY]
Project: [project name] · Sprint: [sprint name or "All Tasks"]

🔴 In Progress ([n])
• [task title] · [type] · [priority]
• [task title] · [type] · [priority]

🟡 In Review ([n])
• [task title] · [type] · [priority]

📌 Backlog: [n] tasks

✅ Completed (Done): [n] tasks
```
- If a section has 0 tasks, omit it from the message
- Truncate task titles to 60 characters if longer

---

## Frontend Architecture

### Directory Structure
```
frontend/
  src/
    components/
      Board/
        Board.tsx          # Root board component
        Column.tsx         # Single column with droppable area
        TaskCard.tsx       # Draggable task card
      Tasks/
        TaskModal.tsx      # Create/edit task modal
      Projects/
        ProjectSwitcher.tsx
        ProjectModal.tsx
      Sprints/
        SprintPanel.tsx
        SprintModal.tsx
      UI/
        Button.tsx         # shadcn-inspired primitives
        Modal.tsx
        Toast.tsx
        Badge.tsx
    api/
      client.ts            # Base fetch wrapper
      tasks.ts
      projects.ts
      sprints.ts
      settings.ts
    hooks/
      useTasks.ts
      useProjects.ts
      useSprints.ts
    store/
      boardStore.ts        # Zustand store for board state
    data/
      constants.ts         # Column definitions, priority colors, etc.
    App.tsx
    main.tsx
```

### State Management
- Zustand for global board state (current project, current sprint filter, tasks)
- React Query (TanStack Query) for server state / caching
- Optimistic updates handled in Zustand before API confirmation

### API Client
- Base URL from environment variable `VITE_API_BASE_URL` (default: `http://localhost:5000`)
- All requests include `Content-Type: application/json`
- No auth headers required for MVP

---

## Backend Architecture

### Directory Structure
```
backend/
  Tracker.Api/
    Controllers/
      ProjectsController.cs
      SprintsController.cs
      TasksController.cs
      SettingsController.cs
      WebhooksController.cs
    Models/
      Project.cs
      Sprint.cs
      TaskItem.cs
      Settings.cs
    DTOs/
      ProjectDto.cs
      SprintDto.cs
      TaskDto.cs
      MoveTaskDto.cs
      SettingsDto.cs
    Data/
      TrackerDbContext.cs
    Services/
      TelegramDigestService.cs    # IHostedService for daily digest
      GitHubWebhookService.cs     # Webhook processing logic
    Migrations/
    appsettings.json
    appsettings.Development.json
    Program.cs
  tests/
    Tracker.Api.Tests/
      TasksControllerTests.cs
      WebhookTests.cs
```

### Environment Variables
```
ConnectionStrings__TrackerDatabase   PostgreSQL connection string
Telegram__BotToken                   Telegram bot token
GitHub__WebhookSecret                GitHub webhook secret (optional)
```

---

## CI/CD

### GitHub Actions Workflow (`.github/workflows/ci.yml`)
- Triggers: push to any branch, pull_request targeting main
- Jobs:
  1. **frontend-test**: `npm --prefix frontend install && npm --prefix frontend run test`
  2. **backend-test**: `dotnet restore` + `dotnet build` + `dotnet test` with correct working directories

### Branch and PR Rules
- All changes via feature branches — never commit directly to main
- Branch naming: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- PRs must target `main` as base branch — always use `gh pr create --base main`
- Merge only when CI passes
- Squash merge, delete branch after merge

---

## Out of Scope for MVP
The following are explicitly excluded and should not be built:
- Authentication (Auth0 or any other)
- Multi-user or team features
- S3 file attachments
- Email via Resend
- Cloud deployment (local dev only)
- Story points or effort estimates
- Labels or tags on tasks
- Comments on tasks
- Task history / audit log
- Search or full-text filtering
- Dark mode

---

## Build Order (Recommended Task Sequence for Agents)

### Phase 1 — Foundation
1. Backend: scaffold ASP.NET Core 8 project, EF Core, PostgreSQL connection, migrations for all models
2. Backend: implement Projects API (CRUD)
3. Backend: implement Tasks API (CRUD + move)
4. Backend: implement Sprints API (CRUD + activate)
5. Backend: implement Settings API
6. Frontend: scaffold Vite/React app with Tailwind, shadcn primitives, Zustand, React Query
7. Frontend: implement API client module
8. Frontend: implement Project switcher

### Phase 2 — Core UI
9. Frontend: implement Kanban board with dnd-kit (drag/drop + keyboard)
10. Frontend: implement Task detail modal (create/edit)
11. Frontend: implement Sprint management panel
12. QA: integration tests for all backend endpoints
13. QA: Vitest component tests for Board, TaskCard, TaskModal

### Phase 3 — Integrations
14. Backend: implement GitHub webhook receiver (signature validation + event processing)
15. Backend: implement Telegram daily digest background service
16. Frontend: settings page (defaultProjectId, telegramChatId, digestTime, webhookSecret)
17. QA: webhook tests, digest tests

---

## Definition of Done (per task/PR)
A task is complete when ALL of the following are true:
- [ ] Feature branch created from latest main
- [ ] Code written and working
- [ ] At least one test covers the new code
- [ ] `git diff` reviewed — no unintended changes
- [ ] Committed with conventional commit message
- [ ] Pushed to feature branch
- [ ] PR opened with `--base main` and description
- [ ] CI passes (all jobs green)
- [ ] PR merged (squash), branch deleted
