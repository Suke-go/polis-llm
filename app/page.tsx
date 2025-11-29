import { prisma } from "@/lib/prisma";
import NewSessionClient from "./sessions/NewSessionClient";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import SessionDashboardCard from "./sessions/SessionDashboardCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let sessions: Array<{
    id: string;
    title: string;
    createdAt: Date;
    _count: {
      propositions: number;
      statements: number;
    };
  }> = [];

  try {
    sessions = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: {
          select: {
            propositions: true,
            statements: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
  }

  // 各セッションの詳細情報を取得
  const sessionsWithDetails = await Promise.all(
    sessions.map(async (session) => {
      const [apsApprovedPropositions, hasStatements, hasAnalysis, story] = await Promise.all([
        prisma.proposition.findMany({
          where: {
            sessionId: session.id,
            status_aps_approved: true,
          },
          select: {
            id: true,
            ja_text: true,
          },
          take: 5,
        }),
        prisma.statement.count({
          where: {
            sessionId: session.id,
            selected_for_voting: true,
          },
        }),
        prisma.analysisResult.findUnique({
          where: { sessionId: session.id },
        }),
        prisma.story.findFirst({
          where: { sessionId: session.id },
          select: {
            image_url: true,
          },
        }),
      ]);

      return {
        ...session,
        apsApprovedCount: apsApprovedPropositions.length,
        hasStatements: hasStatements > 0,
        hasAnalysis: !!hasAnalysis,
        propositions: apsApprovedPropositions,
        imageUrl: story?.image_url ?? null,
      };
    })
  );

  // 統計情報を計算
  const totalSessions = sessionsWithDetails.length;
  const sessionsWithPropositions = sessionsWithDetails.filter((s) => s.apsApprovedCount > 0).length;
  const sessionsWithVotes = sessionsWithDetails.filter((s) => s.hasStatements).length;
  const sessionsWithAnalysis = sessionsWithDetails.filter((s) => s.hasAnalysis).length;
  const totalPropositions = sessionsWithDetails.reduce((sum, s) => sum + s.apsApprovedCount, 0);

  return (
    <div className="space-y-8">
      {/* 統計情報ハイライト */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-4">
          <div className="text-2xl font-bold text-primary mb-1">{totalSessions}</div>
          <div className="text-xs text-text-sub font-medium">全セッション</div>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 p-4">
          <div className="text-2xl font-bold text-accent mb-1">{sessionsWithPropositions}</div>
          <div className="text-xs text-text-sub font-medium">投票可能</div>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 p-4">
          <div className="text-2xl font-bold text-text-main mb-1">{sessionsWithAnalysis}</div>
          <div className="text-xs text-text-sub font-medium">分析済み</div>
        </Card>
        <Card className="bg-gradient-to-br from-slate-100 to-slate-50 border-slate-200 p-4">
          <div className="text-2xl font-bold text-text-main mb-1">{totalPropositions}</div>
          <div className="text-xs text-text-sub font-medium">承認済み命題</div>
        </Card>
      </div>

      <section className="text-center space-y-4 py-8">
        <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          Commons Ground
        </h2>
        <p className="text-lg text-text-sub max-w-2xl mx-auto">
          2050年の社会を構想し、多様な視点から議論を深めるプラットフォーム
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phase 1: 提言・命題づくり */}
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center gap-3">
            <div className="w-1 h-8 bg-primary rounded-full"></div>
            <div>
              <h3 className="text-xl font-bold text-text-main">Phase 1</h3>
              <p className="text-xs text-text-sub">提言・命題づくり</p>
            </div>
          </div>
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <NewSessionClient />
          </Card>
        </div>

        {/* Phase 2 & 3: 投票・分析（統合） */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-1 h-8 bg-accent rounded-full"></div>
              <div className="w-1 h-8 bg-secondary rounded-full"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-main">Phase 2 & 3</h3>
              <p className="text-xs text-text-sub">投票に参加する / 分析・結果を見る</p>
            </div>
            <div className="ml-auto flex gap-2">
              {sessionsWithPropositions > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">
                  {sessionsWithPropositions}件
                </span>
              )}
              {sessionsWithAnalysis > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-text-main text-xs font-bold">
                  {sessionsWithAnalysis}件
                </span>
              )}
            </div>
          </div>
          <Card className="bg-gradient-to-br from-accent/5 via-secondary/5 to-transparent border-accent/20 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phase 2: 投票 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-accent rounded-full"></div>
                  <h4 className="text-sm font-bold text-text-main">投票に参加する</h4>
                </div>
                {sessionsWithDetails.filter((s) => s.apsApprovedCount > 0).length > 0 ? (
                  <div className="space-y-2">
                    {sessionsWithDetails
                      .filter((s) => s.apsApprovedCount > 0)
                      .slice(0, 3)
                      .map((session) => (
                        <SessionDashboardCard
                          key={session.id}
                          session={session}
                          phase="discuss"
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-text-muted text-xs mb-1">
                      APS承認済みの命題があるセッションがありません
                    </p>
                  </div>
                )}
              </div>

              {/* Phase 3: 分析 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-secondary rounded-full"></div>
                  <h4 className="text-sm font-bold text-text-main">分析・結果を見る</h4>
                </div>
                {sessionsWithDetails.filter((s) => s.hasAnalysis).length > 0 ? (
                  <div className="space-y-2">
                    {sessionsWithDetails
                      .filter((s) => s.hasAnalysis)
                      .slice(0, 3)
                      .map((session) => (
                        <SessionDashboardCard
                          key={session.id}
                          session={session}
                          phase="analyze"
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-text-muted text-xs mb-1">
                      分析結果があるセッションがありません
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 全セッション一覧 */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="w-1 h-8 bg-slate-300 rounded-full"></div>
          <div>
            <h3 className="text-xl font-bold text-text-main">全セッション一覧</h3>
            <p className="text-xs text-text-sub">すべてのセッションを表示</p>
          </div>
          {totalSessions > 0 && (
            <span className="ml-auto px-3 py-1 rounded-full bg-slate-100 text-text-main text-xs font-bold">
              {totalSessions}件
            </span>
          )}
        </div>
        <Card className="shadow-lg">
          {sessionsWithDetails.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessionsWithDetails.map((session) => (
                <SessionDashboardCard
                  key={session.id}
                  session={session}
                  phase="all"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-text-muted text-sm mb-2">
                まだセッションはありません
              </p>
              <p className="text-xs text-text-sub">
                新しいセッションを作成してください
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
