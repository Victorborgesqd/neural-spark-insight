import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  type: 'document' | 'code';
  size: string;
  status: 'processing' | 'learned' | 'pending';
  content?: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [learningProgress, setLearningProgress] = useState(0);

  // Load documents from database on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
      return;
    }

    if (data) {
      setDocuments(data.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type as 'document' | 'code',
        size: doc.size || '0 KB',
        status: doc.embedding_status as 'processing' | 'learned' | 'pending',
        content: doc.content || ''
      })));
    }
  };

  const processFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const addDocuments = useCallback(async (files: File[]) => {
    setIsLearning(true);
    setLearningProgress(0);

    const codeExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.rb', '.php'];
    const totalFiles = files.length;
    let processedCount = 0;

    for (const file of files) {
      try {
        const content = await processFile(file);
        const isCode = codeExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

        // Insert document into database
        const { data, error } = await supabase
          .from('documents')
          .insert({
            name: file.name,
            type: isCode ? 'code' : 'document',
            size: `${(file.size / 1024).toFixed(1)} KB`,
            content: content,
            embedding_status: 'processing'
          })
          .select()
          .single();

        if (error) {
          console.error('Error inserting document:', error);
          toast.error(`Erro ao salvar ${file.name}`);
          continue;
        }

        // Add to local state immediately
        setDocuments(prev => [{
          id: data.id,
          name: file.name,
          type: isCode ? 'code' : 'document',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          status: 'processing',
          content
        }, ...prev]);

        // Process document with AI
        const response = await supabase.functions.invoke('process-document', {
          body: {
            documentId: data.id,
            content,
            name: file.name
          }
        });

        if (response.error) {
          console.error('Error processing document:', response.error);
          // Update local state to show learned anyway
          setDocuments(prev => prev.map(doc => 
            doc.id === data.id ? { ...doc, status: 'learned' as const } : doc
          ));
        } else {
          // Update local state
          setDocuments(prev => prev.map(doc => 
            doc.id === data.id ? { ...doc, status: 'learned' as const } : doc
          ));
        }

        processedCount++;
        setLearningProgress((processedCount / totalFiles) * 100);

      } catch (error) {
        console.error('Error processing file:', error);
        toast.error(`Erro ao processar ${file.name}`);
      }
    }

    setIsLearning(false);
    setLearningProgress(100);
    toast.success(`${processedCount} documento(s) aprendido(s)!`);
  }, []);

  const removeDocument = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing document:', error);
      toast.error('Erro ao remover documento');
      return;
    }

    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast.success('Documento removido');
  }, []);

  const getLearnedDocuments = useCallback(() => {
    return documents
      .filter(doc => doc.status === 'learned')
      .map(doc => ({ name: doc.name, content: doc.content || '' }));
  }, [documents]);

  return {
    documents,
    isLearning,
    learningProgress,
    addDocuments,
    removeDocument,
    getLearnedDocuments
  };
}
