# Dashboard Design Decisions

## Overview
Built a real-time sales performance dashboard for Dana, Head of Sales at a 200-person inside-sales team. The goal: answer the question "Are my agents getting better or worse?" and identify who needs coaching on Monday morning.

## Key Decisions

### 1. Core Metric: Connected Calls Last 7 Days
- **Why**: This is Dana's "Monday morning check" — a single number that tells her if the team is performing well week-to-week
- **Implementation**: Live-queried from the database using `getConnectedCallsLastDays(7)`
- **Placement**: Hero section at the top in large, bold typography (black/purple gradient background)
- **No hardcoding**: The number updates in real-time with every page load

### 2. Dashboard Layout (Mobile-First, 375px+)
- **Header**: Logo + title (uses shadcn Card + Image components)
- **Hero Section**: The 7-day connected call count in large type with context
- **Two-column grid (responsive)**:
  - Left: Top 3 agents by connected calls
  - Right: Teams ranked by connect rate (success metric)
- **Summary Stats**: Quick overview of total agents, teams, average connect rate
- **Footer**: Note that all data is live-queried (builds trust)

### 3. Design: Black/Purple with Shield Theme
- **Colors**: Slate-950 base, purple-950 accents, purple-400 highlights
- **Gradient**: Subtle gradient background (slate-950 → purple-950 → slate-900)
- **Cards**: Translucent backgrounds with purple borders for depth
- **Contrast**: White text on dark backgrounds for readability on mobile
- **Logo**: ArmorHQ shield in header (provided, 32×32)

### 4. Supporting Metrics
- **Top Performers**: Agents with most connected calls (coaches know who's carrying the load)
- **Teams by Connect Rate**: Team-level success metric (week-to-week comparison)
- **Summary Stats**: Agent count, team count, average connect rate (operational context)

### 5. Reporting API (4 Endpoints)
All endpoints cache-busted with `no-store` and live-queried:

- **`/api/weekly-digest`**: 28-day daily rollup + top 3 agents + team breakdown
- **`/api/weekly-digest.csv`**: Same daily data in CSV for Google Sheets import
- **`/api/agents/[id]/scorecard`**: Individual agent performance over 14 days
- **`/api/teams/[name]/summary`**: Team rollup + agent breakdown

### 6. Data Layer
- **Single module** (`src/lib/db.ts`): All queries in one place, consistent patterns
- **Query functions** for each metric: `getConnectedCallsLastDays()`, `getTopAgents()`, `getTeamStats()`, etc.
- **No hardcoding**: Database is single source of truth
- **Type safety**: Row types defined; query results typed

### 7. Testing
- **Vitest suite** (`src/__tests__/metrics.test.ts`) covers:
  - Connected call count is non-negative
  - Top agents sorted descending by connected count
  - Daily stats in chronological order
  - Connect rate calculations are correct and between 0–1
- **Focus**: Metric accuracy (what Dana will check)

### 8. Constraints Met
- ✅ Next.js project, no new dependencies
- ✅ shadcn UI components only
- ✅ All queries through `src/lib/db.ts`
- ✅ Mobile-responsive (375px+)
- ✅ Logo in header
- ✅ No console errors
- ✅ At least one test (5 tests actually)
- ✅ 4 API endpoints with correct error handling and headers

## What Dana Gets
1. **Monday Morning Check**: Single prominent number, no guessing
2. **Trend Visibility**: Top agents and teams, this week vs. patterns
3. **Coaching Insights**: Identify which agents/teams to talk to
4. **API Access**: CS team can programmatically fetch data for customer comms

## Future Enhancements (Out of Scope)
- Weekly/monthly trend charts
- Agent onboarding comparisons
- Call quality analysis
- Real-time alerts
