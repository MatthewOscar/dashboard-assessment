import { getAgent, getAgentDailyStats, getAgentTotals, getWindowRange } from "@/lib/db";

export const revalidate = 0;

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const agent = getAgent(agentId);

    if (!agent) {
      return Response.json(
        { error: "agent_not_found", id: agentId },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const dailyStats = getAgentDailyStats(agentId);
    const totals = getAgentTotals(agentId);
    const window = getWindowRange(14);

    return Response.json(
      {
        agent: {
          id: agent.id,
          name: agent.name,
          team: agent.team,
          hire_date: agent.hire_date,
        },
        last_14_days: dailyStats,
        totals,
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
    console.error("agent scorecard error:", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
