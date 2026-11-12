import Conversation from "./conversation";

export const metadata = {
  title: "Multi-model chat",
  description: "Pick two Ollama models and watch Liz and Jarviz discuss your topic.",
};

export default function MultiModelChatPage() {
  return (
    <div className="page-content tutor-page multi-chat-page">
      <header className="topbar">
        <div className="breadcrumb">
          Workspace <span className="breadcrumb-separator" aria-hidden="true">/</span>
          <span className="breadcrumb-current">Multi-model chat</span>
        </div>
      </header>
      <section className="tutor-intro">
        <h1>Multi-model chat</h1>
        <p>Give Liz and Jarviz a topic, choose a model for each, and watch their conversation unfold live.</p>
      </section>
      <Conversation />
    </div>
  );
}
