import AppText from "@/components/ui/AppText";
import ProgressBar from "./ProgressBar";

export default function OnboardingHeader({
  title,
  subtitle,
  step,
  total,
}: {
  title: string;
  subtitle: string;
  step: number;
  total: number;
}) {
  return (
    <>
      <ProgressBar step={step} total={total} />

      <AppText variant="title">{title}</AppText>

      <AppText variant="muted">
        {subtitle}
      </AppText>
    </>
  );
}