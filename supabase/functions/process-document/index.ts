import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  documentId: string;
  content: string;
  name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, content, name } = await req.json() as ProcessRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update document status to processing
    await supabase
      .from("documents")
      .update({ embedding_status: "processing" })
      .eq("id", documentId);

    // Use AI to summarize and extract key information
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um processador de documentos. Analise o documento fornecido e extraia:
1. Um resumo conciso (máximo 500 palavras)
2. Os principais tópicos e conceitos
3. Palavras-chave importantes

Responda em formato estruturado que será útil para buscas futuras.`
          },
          {
            role: "user",
            content: `Processe este documento chamado "${name}":\n\n${content.slice(0, 50000)}`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to process document with AI");
    }

    const aiResponse = await response.json();
    const processedContent = aiResponse.choices?.[0]?.message?.content || content;

    // Update document with processed content
    await supabase
      .from("documents")
      .update({ 
        content: processedContent,
        embedding_status: "learned" 
      })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({ success: true, message: "Documento processado com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Process document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro ao processar documento" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
