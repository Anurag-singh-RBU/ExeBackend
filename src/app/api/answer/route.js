import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// CORS headers
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

export async function POST(req) {

  try {

    const { question, options } = await req.json();

    const prompt = `
Question: ${question}

Options:
${options.join(", ")}

Give only correct option text.
`;

    const completion = await groq.chat.completions.create({

      model: "llama-3.1-8b-instant",

      messages: [
        { role: "user", content: prompt }
      ],

      temperature: 0
    });

    let answer =
      completion.choices[0].message.content.trim();

    // Clean answer
    answer = answer.replace(/^\d+[\.\)]\s*/, "");
    answer = answer.replace(/option\s*\d*[:\-]?\s*/i, "");
    answer = answer.trim();

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
