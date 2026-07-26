export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Bom dia, Moisés 👋
        </h1>

        <p className="text-zinc-400 mt-1">
          Segunda-feira • 27 Jul • 18°C
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
          M
        </div>
      </div>
    </header>
  );
}