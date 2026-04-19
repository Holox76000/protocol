import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";

const DB_COLUMN: Record<string, string> = {
  "nutrition-plan":      "nutrition_plan_content",
  "workout-plan":        "workout_plan_content",
  "sleeping-advices":    "sleeping_advices_content",
  "action-plan":         "action_plan_content",
  "posture-analysis":    "posture_analysis_content",
  "supplement-protocol": "supplement_protocol_content",
};

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const { userId, section, content } = (await request.json()) as {
      userId:  string;
      section: string;
      content: string;
    };

    if (!userId || !section || content === undefined) {
      return NextResponse.json(
        { error: "userId, section, and content are required." },
        { status: 400 },
      );
    }

    const column = DB_COLUMN[section];
    if (!column) {
      return NextResponse.json({ error: `Unknown section: ${section}` }, { status: 400 });
    }

    await supabaseAdmin
      .from("protocols")
      .update({ [column]: content })
      .eq("user_id", userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[save-section]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 },
    );
  }
}
