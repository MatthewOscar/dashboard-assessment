import { getDailyStats, getTopAgents, getTeamsByDate } from "@/lib/db";

export const revalidate = 0;

export async function GET() {
  try {
    const dailyStats = getDailyStats(28);
    const topAgents = getTopAgents();

    // Find top team by day
    const dailyTopTeams = dailyStats.map(day => {
      const teams = getTeamsByDate(day.date);
      const topTeam = teams.length > 0 ? teams.reduce((a, b) => (a.connected_count > b.connected_count ? a : b)) : null;
      return {
        date: day.date,
        connected_count: day.connected_count,
        total_count: day.total_count,
        top_team: topTeam?.team || "",
        top_team_connects: topTeam?.connected_count || 0,
      };
    });

    const now = new Date();
    const windowStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    // Build CSV
    const header = "date,connected_count,total_count,top_team,top_team_connects\n";
    const rows = dailyTopTeams.map(row => {
      const teamName = row.top_team.includes(",") ? `"${row.top_team}"` : row.top_team;
      return `${row.date},${row.connected_count},${row.total_count},${teamName},${row.top_team_connects}`;
    }).join("\n");

    const csv = header + rows;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("weekly-digest.csv error:", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
