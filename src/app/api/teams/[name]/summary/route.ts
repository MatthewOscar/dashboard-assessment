import { getAgents, getTeamStats, getTeamAgents } from "@/lib/db";

export const revalidate = 0;

export async function GET(
  _: Request,
  { params }: { params: { name: string } }
) {
  try {
    const teamName = decodeURIComponent(params.name);
    
    // Check if team exists
    const allAgents = getAgents(teamName);
    if (allAgents.length === 0) {
      return Response.json(
        { error: "team_not_found", name: teamName },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const stats = getTeamStats(teamName);
    const agents = getTeamAgents(teamName);
    const now = new Date();
    const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return Response.json(
      {
        team: {
          name: teamName,
          agent_count: allAgents.length,
        },
        last_7_days: stats,
        agents,
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
    console.error("team summary error:", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
