import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ================= CORS =================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// ================= POST =================

export async function POST(req) {

  try {

    const { question, options } = await req.json();

    // Build prompt
    const prompt = `
You are a smart and precise AI assistant.

Follow these rules strictly:

1. If the question is an MCQ and options are missing or empty,
   reply exactly with:
   "You did not provide the options."

2. If the question is an MCQ and options are given,
   return only the correct option.

3. If the question is theoretical,
   give a clear and complete answer.

4. Do NOT apologize.
5. Do NOT give incomplete sentences.

Question:
${question}

Options:
${options && options.length ? options.join(", ") : "NO_OPTIONS_PROVIDED"}

Answer:
`;

    // Call Groq
    const completion = await groq.chat.completions.create({

      model: "llama-3.1-8b-instant",

      messages: [
        { role: "user", content: prompt }
      ],

      temperature: 0
    });

    // Extract answer
    let answer =
      completion.choices[0].message.content.trim();

    // Cleanup formatting
    answer = answer.replace(/^\d+[\.\)]\s*/, "");
    answer = answer.replace(/option\s*\d*[:\-]?\s*/i, "");
    answer = answer.trim();

    // Return response
    return new Response(
      JSON.stringify({ answer }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (err) {

    console.error("AI ERROR:", err);

    return new Response(
      JSON.stringify({ error: "AI failed" }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
