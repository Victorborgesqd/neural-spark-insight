import { useState, useRef, useEffect } from 'react';
import { Send, Upload, Brain, FileText, Code, Sparkles, Zap, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NeuralNetwork } from '@/components/NeuralNetwork';
import { ChatMessage } from '@/components/ChatMessage';
import { DocumentCard } from '@/components/DocumentCard';
import { UploadZone } from '@/components/UploadZone';
import { CodeAnalysis } from '@/components/CodeAnalysis';
import { StatCard } from '@/components/StatCard';
import { useNeuralChat } from '@/hooks/useNeuralChat';
import { useDocuments } from '@/hooks/useDocuments';

const Index = () => {
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, isTyping, sendMessage, clearMessages } = useNeuralChat();
  const { 
    documents, 
    isLearning, 
    learningProgress, 
    addDocuments, 
    removeDocument,
    getLearnedDocuments 
  } = useDocuments();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;
    const learnedDocs = getLearnedDocuments();
    await sendMessage(inputValue, learnedDocs);
    setInputValue('');
  };

  const handleFilesSelected = async (files: File[]) => {
    await addDocuments(files);
  };

  const mockIssues = documents
    .filter(d => d.type === 'code' && d.status === 'learned')
    .length > 0 ? [
    {
      type: 'duplicate' as const,
      title: 'Função duplicada detectada',
      description: 'A função "formatDate" está definida em dois arquivos diferentes com implementações similares.',
      line: 45,
      suggestion: '// Consolidar em utils/dateHelper.ts\nexport const formatDate = (date: Date) => {\n  return date.toLocaleDateString();\n};'
    },
    {
      type: 'improvement' as const,
      title: 'Oportunidade de refatoração',
      description: 'Este bloco de código pode ser simplificado usando optional chaining.',
      line: 78,
      suggestion: 'const userName = user?.profile?.name ?? "Anônimo";'
    },
    {
      type: 'warning' as const,
      title: 'Variável não utilizada',
      description: 'A variável "tempData" é declarada mas nunca utilizada no escopo.',
      line: 23
    }
  ] : [];

  const learnedCount = documents.filter(d => d.status === 'learned').length;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar - Neural Visualization */}
      <div className="lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-border/50 bg-card/30 flex flex-col">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center box-glow-cyan">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground text-glow-cyan">
                NEURAL.AI
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                {isLearning ? 'Processando...' : 'v2.0.0 • Rede Ativa'}
              </p>
            </div>
          </div>
        </div>

        {/* Neural Network Visualization */}
        <div className="flex-1 min-h-[300px] lg:min-h-0">
          <NeuralNetwork 
            isLearning={isLearning} 
            learningProgress={learningProgress}
            className="w-full h-full"
          />
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-border/50 grid grid-cols-2 gap-3">
          <StatCard
            icon={Database}
            label="Documentos"
            value={learnedCount}
            color="cyan"
          />
          <StatCard
            icon={Zap}
            label="Neurônios"
            value={`${(2.4 + learnedCount * 0.2).toFixed(1)}K`}
            color="purple"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted/30 border border-border/50">
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Chat IA
              </TabsTrigger>
              <TabsTrigger 
                value="learn"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono"
              >
                <Upload className="w-4 h-4 mr-2" />
                Ensinar
              </TabsTrigger>
              <TabsTrigger 
                value="analyze"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono"
              >
                <Code className="w-4 h-4 mr-2" />
                Análise
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} className="h-full flex flex-col">
            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage key={index} {...message} />
                ))}
                {isTyping && (
                  <ChatMessage role="assistant" content="" isTyping />
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-border/50 p-4 bg-card/30">
                <div className="flex gap-3">
                  <Button
                    onClick={clearMessages}
                    variant="outline"
                    size="icon"
                    className="border-border/50 hover:border-primary/50 hover:bg-primary/10"
                    title="Limpar conversa"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder={learnedCount > 0 
                        ? "Pergunte algo sobre seus documentos..." 
                        : "Envie documentos primeiro para fazer perguntas..."}
                      className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 rounded-xl box-glow-cyan disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center font-mono">
                  {learnedCount > 0 
                    ? `${learnedCount} documento(s) na base de conhecimento`
                    : 'Envie documentos na aba "Ensinar" para expandir meu conhecimento'}
                </p>
              </div>
            </TabsContent>

            {/* Learn Tab */}
            <TabsContent value="learn" className="flex-1 overflow-y-auto p-6 m-0 data-[state=inactive]:hidden">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl font-bold text-foreground text-glow-cyan mb-2">
                    Ensine a Neural.AI
                  </h2>
                  <p className="text-muted-foreground">
                    Envie documentos, códigos ou textos para expandir o conhecimento da IA
                  </p>
                </div>

                <UploadZone onFilesSelected={handleFilesSelected} />

                {documents.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-mono text-sm text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Base de Conhecimento ({documents.length})
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {documents.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          name={doc.name}
                          type={doc.type}
                          size={doc.size}
                          status={doc.status}
                          onRemove={() => removeDocument(doc.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Analyze Tab */}
            <TabsContent value="analyze" className="flex-1 overflow-y-auto p-6 m-0 data-[state=inactive]:hidden">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl font-bold text-foreground text-glow-purple mb-2">
                    Análise de Código
                  </h2>
                  <p className="text-muted-foreground">
                    Detecta duplicações, sugere melhorias e refatorações inteligentes
                  </p>
                </div>

                {documents.filter(d => d.type === 'code' && d.status === 'learned').length > 0 ? (
                  <CodeAnalysis 
                    fileName="projeto/src/utils.ts" 
                    issues={mockIssues}
                  />
                ) : (
                  <div className="text-center py-12 bg-card/30 border border-border/50 rounded-xl">
                    <div className="w-16 h-16 mx-auto rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      <Code className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-display text-lg text-foreground mb-2">
                      Nenhum código para analisar
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                      Envie arquivos de código na aba "Ensinar" para análise automática
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
