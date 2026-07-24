export default function PilotSchoolLoading() {
  return (
    <main className="min-h-screen bg-[#f4f2ed] px-4 py-10">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-4 w-44 rounded bg-slate-200" />
        <div className="mt-5 h-12 w-2/3 rounded bg-slate-200" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <div className="h-48 rounded-2xl bg-white" key={index} />)}
        </div>
      </div>
    </main>
  );
}
