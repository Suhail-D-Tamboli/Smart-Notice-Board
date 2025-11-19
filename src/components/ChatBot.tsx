import React, { useState, useRef, useEffect } from 'react';
import { generateChatResponse } from '../services/geminiService';
import './ChatBot.css';

interface Notice {
  _id: string;
  title: string;
  description: string;
  date: string;
  semester?: string;
  department?: string;
  createdBy: string;
  createdAt: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  notices: Notice[];
}

const ChatBot: React.FC<ChatBotProps> = ({ notices }) => {
  console.log('ChatBot component rendering with notices:', notices?.length || 0);
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm your Smart Notice Board assistant. 👋\n\nI can help you find specific notices and answer questions about your campus notices.\n\nTry asking questions like:\n- "What library notices are there?"\n- "Tell me about exam schedules"\n- "Any sports events coming up?"\n\nI'm currently working in fallback mode, so I'll do my best to help based on keywords in your questions.\n\nHow can I help you today?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Debugging: Log notices when they change
  useEffect(() => {
    console.log('ChatBot: Notices updated', notices);
  }, [notices]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Find relevant notices based on user query (fallback method)
  const findRelevantNotices = (query: string): Notice[] => {
    console.log('ChatBot: Finding relevant notices for query:', query);
    console.log('ChatBot: Available notices:', notices);
    
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    console.log('ChatBot: Searching for query (lowercase):', lowerQuery);
    
    // Remove common words that don't help with matching
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'show', 'me', 'about', 'tell', 'what', 'are', 'there'];
    const keywords = lowerQuery.split(' ').filter(word => !stopWords.includes(word) && word.length > 2);
    console.log('ChatBot: Filtered keywords:', keywords);
    
    // If no meaningful keywords, return empty array
    if (keywords.length === 0) {
      return [];
    }
    
    const filteredNotices = notices.filter(notice => {
      // Ensure notice has required properties
      if (!notice) {
        console.log('ChatBot: Skipping null notice');
        return false;
      }
      
      // Add null/undefined checks before calling toLowerCase
      const title = (notice.title || '').toLowerCase();
      const description = (notice.description || '').toLowerCase();
      const createdBy = (notice.createdBy || '').toLowerCase();
      
      console.log('ChatBot: Checking notice:', { 
        title, 
        description, 
        createdBy, 
        date: notice.date 
      });
      
      // Calculate match score based on keyword frequency
      let matchScore = 0;
      
      keywords.forEach(keyword => {
        // Count occurrences of keyword in each field
        const titleMatches = (title.match(new RegExp(keyword, 'g')) || []).length;
        const descriptionMatches = (description.match(new RegExp(keyword, 'g')) || []).length;
        const createdByMatches = (createdBy.match(new RegExp(keyword, 'g')) || []).length;
        
        // Weight matches (title is most important)
        matchScore += (titleMatches * 3) + (descriptionMatches * 2) + (createdByMatches * 1);
        
        console.log(`ChatBot: Keyword "${keyword}" matches - Title: ${titleMatches}, Description: ${descriptionMatches}, CreatedBy: ${createdByMatches}`);
      });
      
      // For date matching
      let dateMatch = false;
      if (notice.date) {
        try {
          const noticeDate = new Date(notice.date);
          const today = new Date();
          
          // Check if query matches today's date
          if (lowerQuery.includes('today') || lowerQuery.includes('now')) {
            dateMatch = noticeDate.toDateString() === today.toDateString();
          } 
          // Check if query contains date-like patterns
          else if (lowerQuery.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) {
            dateMatch = noticeDate.toLocaleDateString().toLowerCase().includes(lowerQuery) || 
                       noticeDate.toDateString().toLowerCase().includes(lowerQuery);
          }
        } catch (e) {
          console.log('ChatBot: Error parsing date:', e);
        }
      }
      
      const hasMatches = matchScore > 0 || dateMatch;
      console.log('ChatBot: Notice match score:', { notice, matchScore, dateMatch, hasMatches });
      
      // Only return notices with some matching score
      return hasMatches;
    });
    
    // Sort by match score (highest first)
    const sortedNotices = filteredNotices.sort((a, b) => {
      // Calculate scores for both notices
      let scoreA = 0, scoreB = 0;
      
      keywords.forEach(keyword => {
        const titleA = (a.title || '').toLowerCase();
        const descriptionA = (a.description || '').toLowerCase();
        const createdByA = (a.createdBy || '').toLowerCase();
        
        const titleB = (b.title || '').toLowerCase();
        const descriptionB = (b.description || '').toLowerCase();
        const createdByB = (b.createdBy || '').toLowerCase();
        
        scoreA += (titleA.match(new RegExp(keyword, 'g')) || []).length * 3;
        scoreA += (descriptionA.match(new RegExp(keyword, 'g')) || []).length * 2;
        scoreA += (createdByA.match(new RegExp(keyword, 'g')) || []).length * 1;
        
        scoreB += (titleB.match(new RegExp(keyword, 'g')) || []).length * 3;
        scoreB += (descriptionB.match(new RegExp(keyword, 'g')) || []).length * 2;
        scoreB += (createdByB.match(new RegExp(keyword, 'g')) || []).length * 1;
      });
      
      return scoreB - scoreA; // Higher scores first
    });
    
    console.log('ChatBot: Found relevant notices (sorted):', sortedNotices);
    return sortedNotices;
  };

  // Handle user message submission
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const query = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Process bot response using Gemini AI
      console.log('ChatBot: Processing query with AI:', query);
      const relevantNotices = findRelevantNotices(query);
      console.log('ChatBot: Found', relevantNotices.length, 'relevant notices');
      
      // Log the notices that will be sent to the AI service
      console.log('ChatBot: Sending notices to AI service:', relevantNotices);
      
      const aiResponse = await generateChatResponse(query, relevantNotices);
      console.log('ChatBot: Received response from AI service:', aiResponse);
      
      const botResponse: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      
      console.log('ChatBot: Sending bot response:', botResponse);
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('ChatBot: Error generating response:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I encountered an error while processing your request. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle chatbot visibility
  const toggleChat = () => {
    console.log('ChatBot: Toggling chat visibility to:', !isOpen);
    setIsOpen(!isOpen);
  };

  return (
    <>
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>Smart Notice Assistant</h3>
            <button className="chatbot-close" onClick={toggleChat}>×</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender}`}
              >
                <div className="message-text">{message.text}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-text">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about notices by name, date, or content..."
              rows={2}
              disabled={isLoading}
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="send-button"
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  );
};

export default ChatBot;