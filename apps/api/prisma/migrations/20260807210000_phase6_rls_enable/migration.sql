-- Activer Row Level Security (RLS) sur toutes les tables publiques
-- Objectif : bloquer l'accès direct via clé Supabase publique
-- L'API NestJS utilise le rôle postgres (service role), donc elle n'est pas affectée.

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Friendship" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CategorySuggestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recommendation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntroductionRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntroductionStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;

-- Note : aucune policy n'est créée, donc par défaut tout accès direct est refusé.
-- Si un jour vous exposez Supabase directement au frontend, il faudra ajouter des policies.
