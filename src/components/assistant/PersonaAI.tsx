import { PersonaAIButton } from './PersonaAIButton';
import { PersonaAIPanel } from './PersonaAIPanel';
import { usePersonaAI } from './usePersonaAI';

/**
 * Persona AI — floating fashion assistant, mounted once in the app shell so
 * it persists across every route.
 */
export function PersonaAI() {
  const { isOpen, close, toggle, messages, isTyping, sendMessage, runQuickAction } = usePersonaAI();

  return (
    <>
      <PersonaAIButton isOpen={isOpen} onClick={toggle} />
      <PersonaAIPanel
        isOpen={isOpen}
        messages={messages}
        isTyping={isTyping}
        onClose={close}
        onSend={sendMessage}
        onQuickAction={runQuickAction}
      />
    </>
  );
}

export { usePersonaAI };
