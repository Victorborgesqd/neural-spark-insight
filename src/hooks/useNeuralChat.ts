import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Document {
  name: string;
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/neural-chat`;

export function useNeuralChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou a Neural.AI. Envie documentos para me ensinar, e eu poderei responder perguntas sobre eles, analisar códigos e sugerir melhorias. Meus neurônios estão prontos para aprender!'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const streamChat = useCallback(async ({
    messages: chatMessages,
    documents,
    onDelta,
    onDone,
    onError
  }: {
    messages: Message[];
    documents: Document[];
    onDelta: (deltaText: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
  }) => {
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: chatMessages, documents }),
      });

      if (resp.status === 429) {
        onError("Limite de requisições excedido. Tente novamente em alguns instantes.");
        return;
      }
      if (resp.status === 402) {
        onError("Créditos insuficientes. Adicione mais créditos ao seu workspace.");
        return;
      }
      if (!resp.ok || !resp.body) {
        onError("Falha ao conectar com a IA.");
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch { /* ignore */ }
        }
      }

      onDone();
    } catch (error) {
      console.error("Stream error:", error);
      onError("Erro de conexão. Verifique sua internet.");
    }
  }, []);

  const sendMessage = useCallback(async (input: string, documents: Document[]) => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    let assistantSoFar = "";
    
    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2].role === "user") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: [...messages, userMessage],
      documents,
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: () => setIsTyping(false),
      onError: (error) => {
        setIsTyping(false);
        toast.error(error);
      }
    });
  }, [messages, streamChat]);

  const clearMessages = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: 'Conversa reiniciada. Estou pronto para ajudar!'
    }]);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearMessages
  };
}
