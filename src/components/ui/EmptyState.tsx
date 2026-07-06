import AppCard from "./AppCard";
import AppText from "./AppText";

export default function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <AppCard>
      <AppText variant="muted">
        {message}
      </AppText>
    </AppCard>
  );
}