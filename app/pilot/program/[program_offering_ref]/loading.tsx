export default function PilotProgramLoading() {
  return (
    <main className="min-h-screen bg-[#f4f2ed] px-4 py-8">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-4 w-56 rounded bg-slate-200" />
        <div className="mt-8 h-12 w-3/4 rounded bg-slate-200" />
        <div aria-label="Loading decision bar" className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => <div className="h-28 rounded-2xl bg-white" key={index} />)}
        </div>
      </div>
    </main>
  );
}
