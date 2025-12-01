
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello! I am KorteX AI. I have access to your tasks and stats. How can I help you optimize your productivity today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: inputText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Fetch full context (stats, tasks, profile, history) to inject into AI
      const context = storageService.getAIContext();
      
      const responseText = await aiService.sendMessage(userMsg.text, context);
      
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: responseText,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: "Sorry, something went wrong. Please try again.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      {/* Header - Simple */}
      <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
        <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
          <i className="fa-solid fa-sparkles text-accent-teal"></i> AI Assistant
        </h2>
        <span className="text-xs bg-accent-teal/10 text-accent-teal px-2 py-1 rounded border border-accent-teal/20">
          Gemini 2.5 Flash
        </span>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-4 scrollbar-hide">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={msg.id} 
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] md:max-w-xl p-3 rounded-2xl text-sm leading-relaxed shadow-sm animate-slide-up whitespace-pre-wrap ${
                  isUser 
                    ? 'bg-accent-teal text-dark-bg rounded-tr-none font-medium' 
                    : 'glass-card text-text-main rounded-tl-none border border-glass-border'
                }`}
              >
                {msg.text}
                <div className={`text-[10px] mt-1 opacity-60 ${isUser ? 'text-dark-bg' : 'text-text-muted'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-none border border-glass-border flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent-teal rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1.5 h-1.5 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-4 glass-panel p-2 rounded-xl border border-glass-border flex-shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about your stats or tasks..."
            className="flex-1 bg-transparent border-none px-4 py-3 text-text-main placeholder-text-muted focus:outline-none focus:ring-0"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-10 h-10 rounded-lg bg-accent-teal text-dark-bg flex items-center justify-center hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
          </button>
        </form>
      </div>
    </div>
  );
};
