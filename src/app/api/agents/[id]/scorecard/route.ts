import { getAgent, getAgentDailyStats, getAgentTotals } from "@/lib/db";

export const revalidate = 0;

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const agent = getAgent(agentId);

    if (!agent) {
      return Response.json(
        { error: "agent_not_found", id: agentId },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const dailyStats = getAgentDailyStats(agentId);
    const totals = getAgentTotals(agentId);
    const now = new Date();
    const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

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
    console.error("agent scorecard error:", err);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}
