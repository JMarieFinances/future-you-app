import AppText from "./AppText";

export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <>
      <AppText variant="title">{title}</AppText>
      {subtitle ? <AppText variant="muted">{subtitle}</AppText> : null}
    </>
  );
}