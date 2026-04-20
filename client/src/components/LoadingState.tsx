export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="card-surface p-6 text-center text-brand-700">
      <p className="animate-pulse">{label}</p>
    </div>
  );
}
