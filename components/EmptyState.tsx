interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <h3 className="text-lg font-medium text-warm-700 mb-2">{title}</h3>
      <p className="text-warm-400 text-sm max-w-md mx-auto mb-6">{description}</p>
      {action}
    </div>
  );
}
