import { getDailyStats, getTopAgents, getTeamsByDate } from "@/lib/db";

export const revalidate = 0;

export async function GET() {
  try {
    const dailyStats = getDailyStats(28);
    const topAgents = getTopAgents();

    // Build team breakdown for each day
    const dataWithTeams = dailyStats.map(day => {
      const teams = getTeamsByDate(day.date);
      const by_team: Record<string, number> = {};
      teams.forEach(t => {
        by_team[t.team] = t.connected_count;
      });
      return {
        date: day.date,
        connected_count: day.connected_count,
        total_count: day.total_count,
        by_team,
      };
    });

    const now = new Date();
    const windowStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    return Response.json(
      {
        data: dataWithTeams,
        top_agents: topAgents.map(a => ({
          name: a.name,
          team: a.team,
          connected_count: a.connected_count,
        })),
        meta: {
          generated_at: now.toISOString(),
          window_start: windowStart.toISOString().split("T")[0],
          window_end: now.toISOString().split("T")[0],
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error("weekly-digest error:", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
