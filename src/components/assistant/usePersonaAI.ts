import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assistantChat, getProducts } from '../../utils/api';
import { ProductQuery, ProductSummary } from '../../types/product';
import { ChatMessage } from '../../types/assistant';
import { defaultCategoryForAudience } from '../../utils/taxonomy';
import {
  BUDGET_TIERS,
  QuickActionId,
  detectIntent,
  formatTierRange,
  getBudgetReply,
  getDesignersReply,
  getFallbackReply,
  getFaqReply,
  getGreetingFollowUpReply,
  getGreetingReply,
  getNavigationReply,
  getSearchEmptyReply,
  getSearchFoundReply,
  getTryOnReply,
  getUfindReply,
  getWeddingReply,
} from '../../utils/personaAssistant';

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

export function usePersonaAI() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const hasGreeted = useRef(false);

  const pushMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...message, id: nextId() }]);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      pushMessage({ role: 'assistant', text: getGreetingReply() });
    }
  }, [pushMessage]);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => (isOpen ? close() : open()), [isOpen, open, close]);

  const runSearch = useCallback(
    async (query: ProductQuery, emptyFallback?: string): Promise<{ text: string; products: ProductSummary[] }> => {
      try {
        const result = await getProducts({ limit: 6, sort: 'relevance', ...query });
        const products = result.products || [];
        return {
          text: products.length ? getSearchFoundReply(products.length) : emptyFallback || getSearchEmptyReply(),
          products,
        };
      } catch {
        return { text: getSearchEmptyReply(), products: [] };
      }
    },
    []
  );

  const goTo = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  const runQuickAction = useCallback(
    async (id: QuickActionId) => {
      pushMessage({ role: 'user', text: quickActionLabel(id) });
      setIsTyping(true);
      try {
        switch (id) {
          case 'find-dresses': {
            const { text, products } = await runSearch({ audience: 'women', category: 'dresses' });
            pushMessage({
              role: 'assistant',
              text,
              products,
              actions: [{ label: 'View all dresses', onClick: () => goTo('/women/dresses') }],
            });
            break;
          }
          case 'mens-collection': {
            const { text, products } = await runSearch({ audience: 'men' });
            pushMessage({
              role: 'assistant',
              text,
              products,
              actions: [
                {
                  label: "Browse Men's Collection",
                  onClick: () => goTo(`/men/${defaultCategoryForAudience('men')}`),
                },
              ],
            });
            break;
          }
          case 'kids-collection': {
            const { text, products } = await runSearch({ audience: 'kids' });
            pushMessage({
              role: 'assistant',
              text,
              products,
              actions: [
                {
                  label: 'Browse Kids Collection',
                  onClick: () => goTo(`/kids/${defaultCategoryForAudience('kids')}`),
                },
              ],
            });
            break;
          }
          case 'shop-by-budget': {
            pushMessage({
              role: 'assistant',
              text: getBudgetReply(),
              actions: BUDGET_TIERS.map((tier) => ({
                label: `${tier.label} (${formatTierRange(tier)})`,
                onClick: () => {
                  const params = new URLSearchParams();
                  if (tier.minPrice) params.set('minPrice', String(tier.minPrice));
                  if (tier.maxPrice) params.set('maxPrice', String(tier.maxPrice));
                  params.set('sort', 'price_asc');
                  goTo(`/search?${params.toString()}`);
                },
              })),
            });
            break;
          }
          case 'try-on-help':
            pushMessage({ role: 'assistant', text: getTryOnReply() });
            break;
          case 'faq':
            pushMessage({ role: 'assistant', text: getFaqReply() });
            break;
          default:
            pushMessage({ role: 'assistant', text: getFallbackReply() });
        }
      } finally {
        setIsTyping(false);
      }
    },
    [pushMessage, runSearch, goTo]
  );

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      pushMessage({ role: 'user', text });
      setIsTyping(true);

      try {
        const intent = detectIntent(text);

        switch (intent.type) {
          case 'greeting':
            pushMessage({ role: 'assistant', text: getGreetingFollowUpReply() });
            break;

          case 'try-on':
            pushMessage({ role: 'assistant', text: getTryOnReply() });
            break;

          case 'budget':
            pushMessage({
              role: 'assistant',
              text: getBudgetReply(),
              actions: BUDGET_TIERS.map((tier) => ({
                label: `${tier.label} (${formatTierRange(tier)})`,
                onClick: () => {
                  const params = new URLSearchParams();
                  if (tier.minPrice) params.set('minPrice', String(tier.minPrice));
                  if (tier.maxPrice) params.set('maxPrice', String(tier.maxPrice));
                  params.set('sort', 'price_asc');
                  goTo(`/search?${params.toString()}`);
                },
              })),
            });
            break;

          case 'wedding': {
            const { products } = await runSearch({ audience: 'women', category: 'wedding-gowns', limit: 4 });
            pushMessage({
              role: 'assistant',
              text: getWeddingReply(),
              products,
              actions: [
                { label: 'View all wedding gowns', onClick: () => goTo('/women/wedding-gowns') },
              ],
            });
            break;
          }

          case 'ufind':
            pushMessage({ role: 'assistant', text: getUfindReply() });
            break;

          case 'navigation':
            pushMessage({ role: 'assistant', text: getNavigationReply() });
            break;

          case 'faq':
            pushMessage({ role: 'assistant', text: getFaqReply() });
            break;

          case 'designers':
            pushMessage({
              role: 'assistant',
              text: getDesignersReply(),
              actions: [{ label: 'Browse Designers', onClick: () => goTo('/designers') }],
            });
            break;

          case 'search': {
            const { text: replyText, products } = await runSearch({
              q: intent.query,
              audience: intent.audience,
              category: intent.category,
              color: intent.color,
            });
            pushMessage({ role: 'assistant', text: replyText, products });
            break;
          }

          case 'unknown':
          default: {
            try {
              const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.text }));
              const response = await assistantChat({ message: text, history });
              pushMessage({
                role: 'assistant',
                text: response.reply || getFallbackReply(),
                products: response.products,
              });
              if (response.navigateTo) {
                goTo(response.navigateTo);
              }
            } catch {
              pushMessage({ role: 'assistant', text: getFallbackReply(), isError: true });
            }
          }
        }
      } finally {
        setIsTyping(false);
      }
    },
    [pushMessage, runSearch, goTo, messages]
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    messages,
    isTyping,
    sendMessage,
    runQuickAction,
  };
}

function quickActionLabel(id: QuickActionId): string {
  switch (id) {
    case 'find-dresses':
      return 'Find Dresses';
    case 'mens-collection':
      return "Men's Collection";
    case 'kids-collection':
      return 'Kids Collection';
    case 'shop-by-budget':
      return 'Shop by Budget';
    case 'try-on-help':
      return 'How to Use Try-On';
    case 'faq':
      return 'Help & FAQs';
    default:
      return id;
  }
}
