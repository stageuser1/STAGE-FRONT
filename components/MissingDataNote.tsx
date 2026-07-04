interface MissingDataNoteProps {
  label?: string;
  className?: string;
}

export function MissingDataNote({
  label = "暂未收录",
  className = "",
}: MissingDataNoteProps) {
  return (
    <span className={`text-sm font-medium text-gray-500 ${className}`}>
      {label}
    </span>
  );
}
