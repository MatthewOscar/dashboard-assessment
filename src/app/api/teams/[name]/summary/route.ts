import { getAgents, getTeamStats, getTeamAgents, getWindowRange } from "@/lib/db";

export const revalidate = 0;

export async function GET(
  _: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const teamName = decodeURIComponent(name);
    
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
    const window = getWindowRange(7);

    return Response.json(
      {
        team: {
          name: teamName,
          agent_count: allAgents.length,
        },
        last_7_days: stats,
        agents,
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
    console.error("team summary error:", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
