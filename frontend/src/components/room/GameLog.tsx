interface GameLogProps {
  logs: string[];
}

export function GameLog({ logs }: GameLogProps) {
  if (logs.length === 0) return null;

  return (
    <div className="space-y-1 py-2">
      {logs.map((log, i) => (
        <p key={i} className="text-center text-xs text-text-muted italic">
          {log}
        </p>
      ))}
    </div>
  );
}
