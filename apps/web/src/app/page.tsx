import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight text-trust-700">
          PLAL
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">
            Se connecter
          </Link>
          <Link href="/register" className="btn-primary">
            Commencer
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-5 pb-16 pt-10 text-center sm:pt-16">
        <span className="chip bg-trust-100 text-trust-700">Le bouche-à-oreille, en mieux</span>
        <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Trouve des personnes fiables grâce à <span className="text-trust-600">ton réseau</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink/70">
          Quelqu&apos;un dans ton réseau connaît probablement la bonne personne. PLAL t&apos;aide à
          la trouver — par tes amis, et les amis de tes amis.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary w-full sm:w-auto">
            Créer mon compte gratuitement
          </Link>
          <Link href="/login" className="btn-secondary w-full sm:w-auto">
            J&apos;ai déjà un compte
          </Link>
        </div>
        <p className="mt-4 text-sm text-ink/40">Sans annuaire public. Sans avis anonymes.</p>
      </section>

      {/* Problème */}
      <section className="mx-auto max-w-4xl px-5 py-12">
        <div className="card text-center">
          <h2 className="text-2xl font-semibold">Les avis anonymes, tu n&apos;y crois plus.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink/60">
            5 étoiles de parfaits inconnus, des commentaires achetés, des classements opaques.
            Pourtant, quand tu cherches vraiment quelqu&apos;un de confiance, tu demandes à tes
            proches. PLAL numérise exactement ça.
          </p>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-4xl px-5 py-8">
        <h2 className="mb-8 text-center text-2xl font-semibold">Comment ça marche</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              n: '1',
              t: 'Ajoute tes proches',
              d: 'Construis ton cercle de confiance avec les gens que tu connais déjà.',
            },
            {
              n: '2',
              t: 'Déclare ce que tu connais',
              d: '"Je connais un bon ostéo", "un garagiste honnête"… sans tout détailler.',
            },
            {
              n: '3',
              t: 'Cherche dans ton réseau',
              d: 'Vois qui, parmi tes amis et amis d\u2019amis, peut vraiment t\u2019aider.',
            },
          ].map((s) => (
            <div key={s.n} className="card">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-trust-600 font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-ink/60">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Amis + amis d'amis */}
      <section className="mx-auto max-w-4xl px-5 py-12">
        <div className="card bg-trust-600 text-center text-white">
          <h2 className="text-2xl font-semibold">Tes amis. Et les amis de tes amis.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/80">
            La confiance se diffuse de proche en proche. PLAL explore deux niveaux de ton réseau pour
            te connecter aux bonnes personnes, sans jamais exposer leurs coordonnées.
          </p>
          <Link href="/register" className="btn mt-6 bg-white text-trust-700 hover:bg-cream">
            Rejoindre PLAL
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-5 py-10 text-center text-sm text-ink/40">
        PLAL — Ton réseau de confiance.
      </footer>
    </main>
  );
}
