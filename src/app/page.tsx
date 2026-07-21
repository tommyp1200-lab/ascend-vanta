import { AscendHero } from "@/components/hero/AscendHero";
import { NarrativeCoordinator } from "@/components/narrative/NarrativeCoordinator";

export default function HomePage() {
  return (
    <NarrativeCoordinator>
      <AscendHero />
    </NarrativeCoordinator>
  );
}
