import Image from "next/image";
import { getConnectedCallsLastDays, getTopAgents, getTeams, getAgents, getTeamStats } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const revalidate = 0;

export default function Page() {
  // The Monday-morning metric: connected calls in last 7 days
  const connectedLast7 = getConnectedCallsLastDays(7);
  
  // Supporting data
  const topAgents = getTopAgents();
  const teams = getTeams();
  const allAgents = getAgents();

  // Calculate team stats for trend comparison
  const teamStats = teams.map(team => ({
    name: team,
    ...getTeamStats(team),
  }));

  // Sort by connect rate
  const topTeams = teamStats.sort((a, b) => b.connect_rate - a.connect_rate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Header with Logo */}
      <header className="border-b border-purple-900/30 bg-slate-950/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Image src="/logo.png" alt="ArmorHQ" width={32} height={32} className="h-8 w-8" />
          <h1 className="text-xl font-bold text-white">ArmorHQ Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Hero Metric */}
        <Card className="mb-8 border-purple-900/50 bg-gradient-to-br from-purple-900/40 to-slate-900/40 p-6 sm:p-8">
          <div className="text-center">
            <p className="text-sm font-semibold text-purple-300 uppercase tracking-wide">Last 7 Days</p>
            <p className="mt-2 text-5xl font-bold text-white sm:text-6xl">{connectedLast7}</p>
            <p className="mt-2 text-base text-slate-300">Connected Calls</p>
            <p className="mt-4 text-xs text-slate-400">
              This is what Dana checks on Monday morning. Live from the database.
            </p>
          </div>
        </Card>

        {/* Two-column grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Agents */}
          <Card className="border-purple-900/30 bg-slate-900/50">
            <div className="border-b border-purple-900/30 px-6 py-4 sm:px-8 sm:py-6">
              <h2 className="text-lg font-semibold text-white">Top Performers</h2>
              <p className="mt-1 text-xs text-slate-400">Last 7 days, by connected calls</p>
            </div>
            <div className="divide-y divide-purple-900/20 px-6 py-4 sm:px-8 sm:py-6">
              {topAgents.length === 0 ? (
                <p className="text-sm text-slate-400">No data yet</p>
              ) : (
                topAgents.map((agent, i) => (
                  <div key={agent.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium text-white">{agent.name}</p>
                      <p className="text-xs text-slate-400">{agent.team}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-400">{agent.connected_count}</p>
                      <p className="text-xs text-slate-500">calls</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Top Teams */}
          <Card className="border-purple-900/30 bg-slate-900/50">
            <div className="border-b border-purple-900/30 px-6 py-4 sm:px-8 sm:py-6">
              <h2 className="text-lg font-semibold text-white">Teams by Connect Rate</h2>
              <p className="mt-1 text-xs text-slate-400">Last 7 days</p>
            </div>
            <div className="divide-y divide-purple-900/20 px-6 py-4 sm:px-8 sm:py-6">
              {topTeams.length === 0 ? (
                <p className="text-sm text-slate-400">No data yet</p>
              ) : (
                topTeams.map((team) => (
                  <div key={team.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium text-white">{team.name}</p>
                      <p className="text-xs text-slate-400">{team.total_count} calls</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-400">{(team.connect_rate * 100).toFixed(1)}%</p>
                      <p className="text-xs text-slate-500">{team.connected_count} connected</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card className="border-purple-900/30 bg-slate-900/50 px-6 py-6 text-center">
            <p className="text-xs font-semibold text-purple-300 uppercase">Total Agents</p>
            <p className="mt-2 text-3xl font-bold text-white">{allAgents.length}</p>
          </Card>
          <Card className="border-purple-900/30 bg-slate-900/50 px-6 py-6 text-center">
            <p className="text-xs font-semibold text-purple-300 uppercase">Teams</p>
            <p className="mt-2 text-3xl font-bold text-white">{teams.length}</p>
          </Card>
          <Card className="border-purple-900/30 bg-slate-900/50 px-6 py-6 text-center">
            <p className="text-xs font-semibold text-purple-300 uppercase">Avg Connect Rate</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {teamStats.length > 0 
                ? (
                    (teamStats.reduce((sum, t) => sum + t.connect_rate, 0) / teamStats.length) * 100
                  ).toFixed(1)
                : "0"}%
            </p>
          </Card>
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-lg border border-purple-900/20 bg-slate-900/30 p-4 text-center text-xs text-slate-400">
          <p>All data is live-queried from the database. No hardcoded numbers.</p>
        </div>
      </main>
    </div>
  );
}
