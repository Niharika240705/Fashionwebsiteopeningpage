import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Baby, HelpCircle, LucideIcon, Send, Shirt, UserRound, Wallet, X, Sparkles } from 'lucide-react';
import { ChatMessage } from '../../types/assistant';
import { QUICK_ACTIONS, QuickActionId } from '../../utils/personaAssistant';

interface PersonaAIPanelProps {
  isOpen: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onQuickAction: (id: QuickActionId) => void;
}

const QUICK_ACTION_ICONS: Record<QuickActionId, LucideIcon> = {
  'find-dresses': Shirt,
  'mens-collection': UserRound,
  'kids-collection': Baby,
  'shop-by-budget': Wallet,
  'try-on-help': Sparkles,
  faq: HelpCircle,
};

export function PersonaAIPanel({
  isOpen,
  messages,
  isTyping,
  onClose,
  onSend,
  onQuickAction,
}: PersonaAIPanelProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, isOpen]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed z-[95] flex flex-col bg-white border border-black/10 shadow-2xl overflow-hidden
            inset-x-0 bottom-0 top-[12vh] rounded-t-3xl
            sm:inset-auto sm:top-auto sm:bottom-28 sm:right-6 sm:w-[400px] sm:h-[620px] sm:max-h-[75vh] sm:rounded-2xl"
          role="dialog"
          aria-label="Persona AI chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 shrink-0">
            <div>
              <h2
                className="text-xl tracking-wide leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Persona AI
              </h2>
              <p className="text-[10px] tracking-[0.2em] uppercase text-black/40 mt-1">
                Your personal fashion assistant
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} onNavigateProduct={(id) => navigate(`/products/${id}`)} />
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 bg-[#f5f3f0] rounded-2xl rounded-tl-sm px-4 py-3 w-fit">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-black/40"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick action chips */}
          <div className="px-3 py-2.5 border-t border-black/10 flex gap-2 overflow-x-auto shrink-0">
            {QUICK_ACTIONS.map((action) => {
              const Icon = QUICK_ACTION_ICONS[action.id];
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => onQuickAction(action.id)}
                  className="shrink-0 inline-flex items-center gap-1.5 border border-black/15 hover:border-black hover:bg-black hover:text-white transition-colors px-3 py-1.5 rounded-full text-[11px] tracking-wide whitespace-nowrap"
                >
                  <Icon size={12} strokeWidth={1.5} />
                  {action.label}
                </button>
              );
            })}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-black/10 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask about styles, sizes, or try-on…"
              className="flex-1 border border-black/15 rounded-full px-4 py-2.5 text-sm outline-none focus:border-black/40 transition-colors"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!input.trim()}
              aria-label="Send message"
              className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-30 transition-opacity shrink-0"
            >
              <Send size={16} strokeWidth={1.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MessageBubble({
  message,
  onNavigateProduct,
}: {
  message: ChatMessage;
  onNavigateProduct: (id: string) => void;
}) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
          isUser
            ? 'bg-black text-white rounded-2xl rounded-tr-sm'
            : `rounded-2xl rounded-tl-sm ${message.isError ? 'bg-red-50 text-black' : 'bg-[#f5f3f0] text-black'}`
        }`}
      >
        {message.text}
      </div>

      {message.products && message.products.length > 0 && (
        <div className="flex gap-2 mt-2 overflow-x-auto max-w-full pb-1">
          {message.products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onNavigateProduct(product.id)}
              className="shrink-0 w-[112px] text-left bg-white border border-black/10 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="w-full h-[96px] bg-neutral-100 overflow-hidden">
                <img
                  src={product.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-2 space-y-0.5">
                <p className="text-[10px] text-black/50 line-clamp-1">{product.brand}</p>
                <p className="text-[11px] font-medium line-clamp-2 leading-tight min-h-[26px]">{product.name}</p>
                <p className="text-xs font-semibold">₹{product.price.toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {message.actions && message.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {message.actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="text-[11px] tracking-wide uppercase border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors rounded-full"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
