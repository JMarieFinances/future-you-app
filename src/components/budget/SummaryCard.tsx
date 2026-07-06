import AppCard from "@/components/ui/AppCard";
import AppText from "@/components/ui/AppText";

export default function SummaryCard({
  title,
  amount,
}: {
  title: string;
  amount: number;
}) {
  return (
    <AppCard>
      <AppText variant="muted">{title}</AppText>

      <AppText variant="section">
        ${amount.toFixed(2)}
      </AppText>
    </AppCard>
  );
}