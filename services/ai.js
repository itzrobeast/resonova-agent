import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateEmail({ name, project, track }) {
  const prompt = `
Write a short email to a music supervisor.

Name: ${name}
Project: ${project}
Track: ${track}

Keep it:
- under 80 words
- casual
- confident
- not salesy
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return response.choices[0].message.content;
}
