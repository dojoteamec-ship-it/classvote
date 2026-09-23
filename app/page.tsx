import Link from "next/link";

// Los alumnos entran desde el enlace de su cinturón (/votar/[slug]).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">ClassVote</h1>
      <p className="max-w-md text-base opacity-80">
        Votación de temas para las clases Mondo de RoninX Academy. Entra desde
        el enlace de tu cinturón.
      </p>
      <Link href="/mentor" className="text-sm underline opacity-70">
        Acceso mentores
      </Link>
    </main>
  );
}
