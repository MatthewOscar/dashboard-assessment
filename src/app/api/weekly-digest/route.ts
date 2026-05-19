import { getDailyStats, getTopAgents, getTeamsByDate, getWindowRange } from "@/lib/db";

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

    const window = getWindowRange(28);

    return Response.json(
      {
        data: dataWithTeams,
        top_agents: topAgents.map(a => ({
          name: a.name,
          team: a.team,
          connected_count: a.connected_count,
        })),
        meta: {
          generated_at: new Date().toISOString(),
          window_start: window.start,
          window_end: window.end,
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
