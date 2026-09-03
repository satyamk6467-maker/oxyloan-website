import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";
import RoadmapTimeline from "@/components/home/RoadmapTimeline";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Track OxyLoan's development milestones from testnet launch through mainnet, governance, and multi-chain expansion.",
};

export default function RoadmapPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="section-container">
        <SectionHeading
          eyebrow="Roadmap"
          title="Our path forward"
          description="Milestones are reviewed and updated quarterly. Dates are indicative and may shift based on audit results and market conditions."
        />
        <RoadmapTimeline />
      </div>
    </div>
  );
}
