import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

    const body = await req.json();

    const question = body.question || "";
    const options = body.options || [];

    // Hard check: if options missing, don't use AI
    if(!Array.isArray(options) || options.length === 0){

      return new Response(
        JSON.stringify({
          answer: "You did not provide the options."
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type":"application/json"
          }
        }
      );
    }

    const prompt = `
You are a smart AI assistant.

Rules:
- Return only the correct option for MCQs.
- Give clear answers for theory.
- Do not apologize.
- Do not write incomplete sentences.

Question:
${question}

Options:
${options.join(", ")}

Answer:
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

    answer = answer.replace(/^\d+[\.\)]\s*/, "");
    answer = answer.replace(/option\s*\d*[:\-]?\s*/i, "");
    answer = answer.trim();

    return new Response(
      JSON.stringify({ answer }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type":"application/json"
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
