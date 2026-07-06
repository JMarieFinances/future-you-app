import AppText from "./AppText";

export default function SectionHeader({ title }: { title: string }) {
  return <AppText variant="section">{title}</AppText>;
}