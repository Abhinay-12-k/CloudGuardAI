import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, RotateCcw, Key } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useStore } from '@/store';
import { useCloudSimulation } from '@/hooks/useCloudSimulation';
import { sendChatMessage, buildChatSystemPrompt } from '@/lib/claudeApi';
import { generateId } from '@/lib/utils';
import type { ChatMessage } from '@/types';

const QUICK_PROMPTS = [
  'Which node is most at risk right now?',
  'Summarize current system health',
  'What should I prioritize fixing?',
  'Predict the next 2 hours',
  'Explain the current critical alerts',
  'Which services are degraded?',
  'Show me the worst performing nodes',
];

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">CG</div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-200">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-slate-300"
              style={{ animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-[#6366f1] text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">CG</div>
      <div
        className="max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
        style={{
          background: message.error ? '#fef2f2' : '#ffffff',
          border: `1px solid ${message.error ? '#fecaca' : '#e2e8f0'}`,
        }}
      >
        <div className="whitespace-pre-wrap text-slate-700">
          {message.content}
          {message.isStreaming && <span className="animate-pulse text-[#6366f1]">▊</span>}
        </div>
        <p className="text-[10px] text-slate-400 mt-2">{formatDistanceToNow(new Date(message.timestamp))} ago</p>
      </div>
    </div>
  );
}

export function AiChat() {
  const navigate = useNavigate();
  const { nodes, isLoading } = useCloudSimulation();
  const { alerts, predictions, settings, systemHealthScore } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m CloudGuard AI, your infrastructure reliability assistant. I have real-time access to all 12 nodes in your infrastructure. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming || !settings.anthropicApiKey) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);

    const systemPrompt = buildChatSystemPrompt(nodes, alerts, predictions, systemHealthScore);
    const history = [...messages, userMsg]
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      await sendChatMessage(history, systemPrompt, settings.anthropicApiKey, (chunk) => {
        setMessages((prev) => prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: m.content + chunk }
            : m
        ));
      });
    } catch (err) {
      setMessages((prev) => prev.map((m) =>
        m.id === assistantMsg.id
          ? { ...m, content: err instanceof Error ? err.message : 'Failed to get response', error: true, isStreaming: false }
          : m
      ));
    } finally {
      setMessages((prev) => prev.map((m) =>
        m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
      ));
      setIsStreaming(false);
    }
  }, [messages, nodes, alerts, predictions, settings, systemHealthScore, isStreaming]);

  function handleSend() {
    sendMessage(input);
  }

  function clearChat() {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: 'Chat cleared. How can I help you with your infrastructure?',
      timestamp: new Date(),
    }]);
  }

  const criticalCount = nodes.filter((n) => n.status === 'critical' || n.status === 'failed').length;
  const warningCount = nodes.filter((n) => n.status === 'warning').length;
  const activeAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <PageWrapper title="AI Chat">
      <div className="flex flex-col" style={{ height: 'calc(100vh - 52px - 48px)' }}>
        {/* System health bar */}
        <div
          className="flex items-center gap-4 mb-4 rounded-xl text-xs"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full status-pulse"
              style={{ background: systemHealthScore >= 80 ? '#10b981' : systemHealthScore >= 60 ? '#f59e0b' : '#ef4444' }}
            />
            <span style={{ color: systemHealthScore >= 80 ? '#10b981' : systemHealthScore >= 60 ? '#f59e0b' : '#ef4444' }}>
              Health: {systemHealthScore}/100
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-red-500">Critical: {criticalCount}</span>
          <span className="text-amber-500">Warning: {warningCount}</span>
          <span className="text-slate-400">Alerts: {activeAlerts}</span>
          <span className="text-slate-400">Nodes: {nodes.length - criticalCount}/{nodes.length} OK</span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isStreaming && messages[messages.length - 1]?.role === 'user' && <TypingIndicator />}
        </div>

        {/* Quick prompts */}
        {!isLoading && (
          <div className="flex flex-wrap gap-2 py-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={isStreaming || !settings.anthropicApiKey}
                className="text-xs px-3 py-1.5 rounded-full transition-all border border-slate-200 text-slate-500 hover:border-[#6366f1] hover:text-[#6366f1] hover:bg-indigo-50 disabled:opacity-40 bg-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="pt-2 border-t border-slate-200">
          {!settings.anthropicApiKey ? (
            <div className="text-center py-6">
              <Key size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Configure your Anthropic API key in Settings to enable AI Chat</p>
              <button
                onClick={() => navigate('/settings')}
                className="mt-3 text-[#6366f1] hover:underline text-sm"
              >
                Go to Settings →
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors bg-white border border-slate-200 hover:border-slate-300"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !isStreaming && handleSend()}
                placeholder="Ask CloudGuard AI anything about your infrastructure..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
                disabled={isStreaming}
              />
              <button onClick={clearChat} title="Clear chat" className="text-slate-400 hover:text-slate-600 transition-colors">
                <RotateCcw size={14} />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="w-8 h-8 rounded-xl btn-gradient flex items-center justify-center disabled:opacity-40"
              >
                <ArrowUp size={14} className="text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

export default AiChat;
