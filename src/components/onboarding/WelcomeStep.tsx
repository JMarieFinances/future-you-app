import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import OnboardingHeader from "./OnboardingHeader";

export default function WelcomeStep({
  onNext,
}: {
  onNext: () => void;
}) {
  return (
    <>
      <OnboardingHeader
        title="Welcome to Future You"
        subtitle="Let's build a financial plan designed around your life."
        step={1}
        total={9}
      />

      <AppText>
        This should only take about three minutes.
      </AppText>

      <AppButton
        title="Let's Begin"
        onPress={onNext}
      />
    </>
  );
}