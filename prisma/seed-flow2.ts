import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Flow2 test data...");

  // 1. セッションを作成
  const session = await prisma.session.create({
    data: {
      title: "自動運転レーンと商店街の未来",
      prompt: "2030年の都市における自動運転レーンと商店街の共存について"
    }
  });

  console.log(`✅ Created session: ${session.id}`);

  // 2. ストーリーを作成（画像URLは任意）
  const story = await prisma.story.create({
    data: {
      sessionId: session.id,
      sf_story_ja: "2030年、都市部では自動運転専用レーンが整備され、人々の移動が劇的に変化した。",
      policy_story_ja: "2030年、都市部では自動運転専用レーンが整備され、人々の移動が劇的に変化した。商店街は新しい交通システムと共存する必要がある。",
      status_story_approved: true,
      image_url: "https://via.placeholder.com/800x600?text=Future+City",
      status_image_generated: true
    }
  });

  console.log(`✅ Created story: ${story.id}`);

  // 3. APS承認済みの命題を作成
  const propositions = [
    {
      ja_text: "自動運転レーンを商店街に導入すべきだ",
      en_text: "Autonomous driving lanes should be introduced to shopping districts",
      back_translated_ja: "自動運転レーンを商店街に導入すべきだ",
      status_edit_approved: true,
      status_aps_approved: true
    },
    {
      ja_text: "高齢者向けの移動支援サービスを拡充すべきだ",
      en_text: "Mobility support services for the elderly should be expanded",
      back_translated_ja: "高齢者向けの移動支援サービスを拡充すべきだ",
      status_edit_approved: true,
      status_aps_approved: true
    },
    {
      ja_text: "商店街へのアクセスを優先する交通政策を実施すべきだ",
      en_text: "Transportation policies that prioritize access to shopping districts should be implemented",
      back_translated_ja: "商店街へのアクセスを優先する交通政策を実施すべきだ",
      status_edit_approved: true,
      status_aps_approved: true
    },
    {
      ja_text: "自動運転車両の駐車場を商店街周辺に整備すべきだ",
      en_text: "Parking lots for autonomous vehicles should be developed around shopping districts",
      back_translated_ja: "自動運転車両の駐車場を商店街周辺に整備すべきだ",
      status_edit_approved: true,
      status_aps_approved: true
    },
    {
      ja_text: "商店街の活性化と交通インフラの整備を同時に進めるべきだ",
      en_text: "Revitalization of shopping districts and transportation infrastructure development should proceed simultaneously",
      back_translated_ja: "商店街の活性化と交通インフラの整備を同時に進めるべきだ",
      status_edit_approved: true,
      status_aps_approved: true
    }
  ];

  const createdPropositions = await Promise.all(
    propositions.map((prop) =>
      prisma.proposition.create({
        data: {
          sessionId: session.id,
          ...prop
        }
      })
    )
  );

  console.log(`✅ Created ${createdPropositions.length} propositions`);

  console.log("\n🎉 Flow2 test data seeded successfully!");
  console.log(`\n📋 Session ID: ${session.id}`);
  console.log(`🔗 Test URL: http://localhost:3000/sessions/${session.id}/tiles`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

