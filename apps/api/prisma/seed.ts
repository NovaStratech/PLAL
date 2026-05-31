import { PrismaClient, FriendshipStatus, RecommendationType, RecommendationVisibility } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { slug: 'artisans', name: 'Artisans' },
  { slug: 'sante-bien-etre', name: 'Santé / bien-être' },
  { slug: 'sport', name: 'Sport' },
  { slug: 'loisirs', name: 'Loisirs' },
  { slug: 'restaurants-sorties', name: 'Restaurants / sorties' },
  { slug: 'automobile', name: 'Automobile' },
  { slug: 'juridique', name: 'Juridique' },
  { slug: 'services-domicile', name: 'Services à domicile' },
  { slug: 'enfants-famille', name: 'Enfants / famille' },
  { slug: 'associations', name: 'Associations' },
  { slug: 'autre', name: 'Autre' },
];

const DEMO_PASSWORD = 'password123';

async function main() {
  console.log('🌱 Seeding...');

  // --- Categories ---
  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
  }
  const categories = await prisma.category.findMany();
  const catBySlug = (slug: string) => {
    const c = categories.find((x) => x.slug === slug);
    if (!c) throw new Error(`Category ${slug} not found`);
    return c.id;
  };

  // --- Users + profiles ---
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const usersData = [
    { email: 'alex@plal.test', firstName: 'Alex', lastName: 'Martin', city: 'Montréal', country: 'Canada' },
    { email: 'marc@plal.test', firstName: 'Marc', lastName: 'Tremblay', city: 'Montréal', country: 'Canada' },
    { email: 'sophie@plal.test', firstName: 'Sophie', lastName: 'Bélanger', city: 'Montréal', country: 'Canada' },
    { email: 'lea@plal.test', firstName: 'Léa', lastName: 'Roy', city: 'Laval', country: 'Canada' },
    { email: 'thomas@plal.test', firstName: 'Thomas', lastName: 'Gagnon', city: 'Montréal', country: 'Canada' },
    { email: 'nadia@plal.test', firstName: 'Nadia', lastName: 'Khaled', city: 'Longueuil', country: 'Canada' },
    { email: 'julien@plal.test', firstName: 'Julien', lastName: 'Côté', city: 'Montréal', country: 'Canada' },
    { email: 'emma@plal.test', firstName: 'Emma', lastName: 'Lefebvre', city: 'Laval', country: 'Canada' },
    { email: 'karim@plal.test', firstName: 'Karim', lastName: 'Benali', city: 'Montréal', country: 'Canada' },
    { email: 'chloe@plal.test', firstName: 'Chloé', lastName: 'Moreau', city: 'Brossard', country: 'Canada' },
  ];

  const users: Record<string, { id: string }> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        emailVerified: true,
        onboardingCompleted: true,
        profile: {
          create: {
            firstName: u.firstName,
            lastName: u.lastName,
            city: u.city,
            country: u.country,
          },
        },
      },
    });
    users[u.firstName] = { id: user.id };
  }

  // --- Friendships (accepted) ---
  const friendships: Array<[string, string, FriendshipStatus]> = [
    ['Alex', 'Marc', FriendshipStatus.accepted],
    ['Alex', 'Sophie', FriendshipStatus.accepted],
    ['Marc', 'Léa', FriendshipStatus.accepted], // Léa = amie d'ami d'Alex
    ['Marc', 'Thomas', FriendshipStatus.accepted],
    ['Sophie', 'Nadia', FriendshipStatus.accepted], // Nadia = amie d'ami d'Alex
    ['Sophie', 'Julien', FriendshipStatus.accepted],
    ['Léa', 'Emma', FriendshipStatus.accepted],
    ['Thomas', 'Karim', FriendshipStatus.accepted],
    ['Nadia', 'Chloé', FriendshipStatus.accepted],
    ['Julien', 'Karim', FriendshipStatus.accepted],
    ['Alex', 'Thomas', FriendshipStatus.pending], // demande en attente
  ];

  for (const [a, b, status] of friendships) {
    const requesterId = users[a].id;
    const receiverId = users[b].id;
    await prisma.friendship.upsert({
      where: { requesterId_receiverId: { requesterId, receiverId } },
      update: { status },
      create: { requesterId, receiverId, status },
    });
  }

  // --- Recommendations ---
  const recos: Array<{
    owner: string;
    slug: string;
    title: string;
    description?: string;
    city: string;
    type: RecommendationType;
    visibility: RecommendationVisibility;
  }> = [
    {
      owner: 'Marc',
      slug: 'sante-bien-etre',
      title: 'Un bon ostéo',
      description: "Ostéopathe sérieux, prend le temps. Idéal pour le dos.",
      city: 'Montréal',
      type: RecommendationType.person,
      visibility: RecommendationVisibility.friends_of_friends,
    },
    {
      owner: 'Sophie',
      slug: 'automobile',
      title: 'Un garagiste honnête',
      description: 'Ne gonfle jamais la facture, travail rapide.',
      city: 'Montréal',
      type: RecommendationType.service,
      visibility: RecommendationVisibility.friends_of_friends,
    },
    {
      owner: 'Léa',
      slug: 'enfants-famille',
      title: 'Une super nounou',
      description: 'Douce et fiable, dispo le week-end.',
      city: 'Laval',
      type: RecommendationType.person,
      visibility: RecommendationVisibility.friends_of_friends,
    },
    {
      owner: 'Thomas',
      slug: 'sport',
      title: 'Club de ping-pong sympa',
      description: 'Ambiance détendue, ouvert aux débutants.',
      city: 'Montréal',
      type: RecommendationType.activity,
      visibility: RecommendationVisibility.friends_of_friends,
    },
    {
      owner: 'Nadia',
      slug: 'juridique',
      title: 'Un bon avocat en droit du travail',
      city: 'Longueuil',
      type: RecommendationType.person,
      visibility: RecommendationVisibility.friends,
    },
    {
      owner: 'Julien',
      slug: 'restaurants-sorties',
      title: 'Un resto local authentique',
      description: 'Petite adresse familiale, cuisine maison.',
      city: 'Montréal',
      type: RecommendationType.place,
      visibility: RecommendationVisibility.friends_of_friends,
    },
    {
      owner: 'Sophie',
      slug: 'artisans',
      title: 'Un plombier réactif',
      city: 'Montréal',
      type: RecommendationType.service,
      visibility: RecommendationVisibility.friends_of_friends,
    },
  ];

  // Clean existing demo recos to keep seed idempotent-ish
  for (const r of recos) {
    const existing = await prisma.recommendation.findFirst({
      where: { userId: users[r.owner].id, title: r.title },
    });
    if (!existing) {
      await prisma.recommendation.create({
        data: {
          userId: users[r.owner].id,
          categoryId: catBySlug(r.slug),
          title: r.title,
          description: r.description,
          city: r.city,
          type: r.type,
          visibility: r.visibility,
        },
      });
    }
  }

  // --- One demo introduction request: Alex -> Marc about ostéo ---
  const osteo = await prisma.recommendation.findFirst({
    where: { userId: users['Marc'].id, title: 'Un bon ostéo' },
  });
  if (osteo) {
    const existingIntro = await prisma.introductionRequest.findFirst({
      where: { requesterId: users['Alex'].id, recommendationId: osteo.id },
    });
    if (!existingIntro) {
      await prisma.introductionRequest.create({
        data: {
          requesterId: users['Alex'].id,
          recommenderId: users['Marc'].id,
          recommendationId: osteo.id,
          message: 'Salut Marc, je cherche un bon ostéo à Montréal. Tu peux me mettre en relation ?',
        },
      });
      await prisma.notification.create({
        data: {
          userId: users['Marc'].id,
          type: 'introduction_request',
          payload: { from: 'Alex', recommendation: 'Un bon ostéo' },
        },
      });
    }
  }

  console.log('✅ Seed terminé.');
  console.log(`   Comptes démo (mot de passe: ${DEMO_PASSWORD}) :`);
  usersData.forEach((u) => console.log(`   - ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
