import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  documents?: Array<{ name: string; content: string }>;
  type?: "chat" | "analyze-code";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, documents, type = "chat" } = await req.json() as ChatRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    if (type === "analyze-code") {
      systemPrompt = `Você é um especialista em análise de código. Analise o código fornecido e identifique:
1. Funções duplicadas ou código redundante
2. Oportunidades de refatoração
3. Possíveis bugs ou problemas de performance
4. Sugestões de melhorias

Responda em JSON com o formato:
{
  "issues": [
    {
      "type": "duplicate" | "improvement" | "warning",
      "title": "Título curto",
      "description": "Descrição do problema",
      "line": número_da_linha_aproximado,
      "suggestion": "código sugerido (opcional)"
    }
  ]
}`;
    } else {
      // Build context from documents
      let documentContext = "";
      if (documents && documents.length > 0) {
        documentContext = "\n\n### DOCUMENTOS APRENDIDOS:\n" + 
          documents.map(doc => `\n--- ${doc.name} ---\n${doc.content}`).join("\n");
      }

      systemPrompt = `Você é a Neural.AI, uma inteligência artificial avançada com capacidade de aprender, analisar documentos complexos e GERAR NOVOS DOCUMENTOS.

SUAS CAPACIDADES:
- Responder perguntas baseadas nos documentos fornecidos
- Analisar e explicar conceitos complexos
- Fazer conexões entre diferentes partes dos documentos
- Sugerir insights e resumos
- **GERAR DOCUMENTOS COMPLETOS**: Quando o usuário pedir explicitamente, você DEVE gerar arquivos COMPLETOS

GERAÇÃO DE DOCUMENTOS - REGRAS CRÍTICAS:
Quando o usuário solicitar a criação/geração de um documento (ex: "gere um arquivo", "crie um documento", "refatore esse código e gere", "crie um resumo em arquivo", "consolide em um documento"), você DEVE:

1. **NUNCA TRUNCAR OU OMITIR CÓDIGO** - O arquivo gerado deve ser 100% COMPLETO e FUNCIONAL
2. **NUNCA usar comentários como "// ... resto do código"** - Inclua TODO o código
3. **NUNCA pular funções, imports, ou qualquer parte** - Tudo deve estar presente
4. Se o código original tem 100 linhas, o refatorado deve ter todas as funcionalidades

FORMATO DO ARQUIVO GERADO:
\`\`\`:::GENERATED_FILE:::
{
  "filename": "nome_do_arquivo.extensao",
  "type": "code" | "text" | "markdown",
  "description": "Breve descrição do que é o arquivo",
  "content": "CONTEÚDO 100% COMPLETO DO ARQUIVO AQUI - SEM OMISSÕES"
}
\`\`\`:::END_FILE:::

CHECKLIST OBRIGATÓRIO ANTES DE GERAR:
✅ Todos os imports estão incluídos?
✅ Todas as funções estão completas?
✅ Todas as variáveis e constantes estão presentes?
✅ O código vai funcionar se copiado diretamente?
✅ Não há "..." ou "resto do código" em lugar nenhum?

Para código refatorado:
- Use extensão adequada (.js, .ts, .py, etc.)
- Mantenha TODA a funcionalidade original
- Apenas melhore a estrutura, não remova nada

Para consolidação de documentos:
- Use .md ou .txt
- Inclua TODAS as informações relevantes

IMPORTANTE:
- Só gere arquivos quando EXPLICITAMENTE solicitado
- Perguntas normais NÃO devem gerar arquivos
- Sempre inclua uma explicação do que foi gerado antes do bloco do arquivo

DIRETRIZES GERAIS:
- Sempre baseie suas respostas nos documentos disponíveis quando relevante
- Se não tiver informação suficiente, diga claramente
- Seja preciso e cite partes específicas dos documentos quando possível
- Mantenha um tom profissional mas amigável
- Responda sempre em português${documentContext}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 16000,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione mais créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua requisição." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
