import Conversation from "./conversation";
import { PageHeading, ToolFooter } from "@/components/studio-ui";

export const metadata = {
  title: "Model conversations",
  description:
    "Pick two Ollama models and explore a topic with Liz and Jarviz.",
};
export default function MultiModelChatPage() {
  return (
    <div className="studio-page">
      <PageHeading
        title="Model conversations"
        description="Give two models a shared topic. Follow the discussion and compare their perspectives."
      />
      <Conversation />
      <ToolFooter>Two participants. One conversation.</ToolFooter>
    </div>
  );
}
