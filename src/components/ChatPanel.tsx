import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessage, GamePhase } from '../shared/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  phase: GamePhase;
  isDrawer: boolean;
  hasGuessed: boolean;
  isSpectator: boolean;
  onSendMessage: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  phase,
  isDrawer,
  hasGuessed,
  isSpectator,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  let placeholder = 'Type your guess here...';
  if (phase === 'lobby' || phase === 'round_end' || phase === 'game_over') {
    placeholder = 'Type your message here...';
  } else if (isDrawer) {
    placeholder = 'Chat (no spoilers)...';
  } else if (hasGuessed) {
    placeholder = 'Guessed! Chat here...';
  } else if (isSpectator) {
    placeholder = 'Spectator chat...';
  }

  return (
    <aside
      aria-label="Guesses and chat"
      className="bg-white text-[#111827] rounded-[3px] flex flex-col min-h-0 h-full shadow-sm overflow-hidden"
    >
      <div
        data-testid="chat-feed"
        className="flex-1 overflow-y-auto min-h-[200px] text-[13px] divide-y divide-[#F3F4F6]"
      >
        {messages.map((msg, idx) => {
          if (msg.type === 'guess_correct') {
            return (
              <div
                key={msg.id}
                className="px-2.5 py-1.5 bg-[#E6FBE2] text-[#269E18] font-extrabold"
              >
                {msg.text}
              </div>
            );
          }
          if (msg.type === 'guess_close') {
            return (
              <div
                key={msg.id}
                className="px-2.5 py-1.5 bg-[#FEF3C7] text-[#B45309] font-extrabold"
              >
                {msg.text}
              </div>
            );
          }
          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className={`px-2.5 py-1.5 font-bold text-[#E58814] ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'
                }`}
              >
                {msg.text}
              </div>
            );
          }
          return (
            <div
              key={msg.id}
              className={`px-2.5 py-1.5 leading-snug break-words ${
                idx % 2 === 0 ? 'bg-white' : 'bg-[#F7F7F7]'
              }`}
            >
              <span className="font-extrabold text-[#111827]">{msg.playerName}: </span>
              <span className="font-semibold text-[#1F2937]">{msg.text}</span>
            </div>
          );
        })}
        <div ref={listEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-1.5 border-t border-[#E5E7EB] bg-white flex items-center gap-1.5">
        <label htmlFor="guess-chat-input" className="sr-only">
          Type your guess or chat message
        </label>
        <input
          id="guess-chat-input"
          type="text"
          maxLength={120}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-9 px-2.5 rounded-[2px] border border-[#D1D5DB] bg-white text-sm font-semibold text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:border-[#2C8DFC]"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="h-9 w-9 rounded-[2px] bg-[#2C8DFC] hover:bg-[#1E7CEB] text-white inline-flex items-center justify-center shrink-0 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
