import Conversation from "./conversation";

export const metadata = {
  title: "Model conversations",
  description:
    "Pick two Ollama models and explore a topic with Liz and Jarviz.",
};
export default function MultiModelChatPage() {
  return <Conversation />;
}
