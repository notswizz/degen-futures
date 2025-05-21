import { useState, useRef, useEffect } from 'react';

export default function ChatBox() {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hi there! I\'m the Degen Futures assistant. How can I help you understand our fantasy NFL prediction market?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mobile when component mounts
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    // Only auto-focus on desktop to avoid mobile keyboard popping up automatically
    if (!isMobile) {
      inputRef.current?.focus();
    }
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to the chat
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    setInput('');
    
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add bot response to the chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[500px] md:h-[600px] bg-gray-900/80 border-2 border-cyan-500/20 rounded-xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-sm glow-effect">
      <div className="p-3 md:p-4 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-b border-cyan-800/30 flex items-center">
        <div className="w-3 h-3 rounded-full bg-cyan-400 mr-3 animate-pulse"></div>
        <div>
          <h2 className="text-lg md:text-xl font-bold text-cyan-300">Degen Futures Assistant</h2>
          <p className="text-cyan-200 text-xs md:text-sm">Ask me anything about how Degen Futures works!</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scrollbar-thin scrollable">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} chat-message`}
          >
            <div 
              className={`max-w-[85%] md:max-w-[80%] rounded-lg p-2.5 md:p-3 ${
                message.role === 'user' 
                  ? 'bg-cyan-700 text-white rounded-br-none' 
                  : 'bg-gray-800 text-cyan-100 rounded-bl-none'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start chat-message">
            <div className="max-w-[85%] md:max-w-[80%] rounded-lg p-2.5 md:p-3 bg-gray-800 text-cyan-100 rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150"></div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="border-t border-cyan-800/30 p-3 md:p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Degen Futures..."
            className="flex-1 bg-gray-800 border border-cyan-700/50 rounded-lg px-3 py-2 text-white text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="mobile-btn bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3 md:px-4 py-2 rounded-lg font-bold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 