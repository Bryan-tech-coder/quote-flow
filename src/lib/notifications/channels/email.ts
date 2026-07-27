export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  attachment?: { filename: string; content: Buffer };
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATIONS_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!apiKey) {
    const attachmentNote = params.attachment ? ` attachment=${params.attachment.filename}` : "";
    console.log(
      `[notifications:email:dev] to=${params.to} subject="${params.subject}"${attachmentNote}`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      text: params.body,
      ...(params.attachment && {
        attachments: [
          {
            filename: params.attachment.filename,
            content: params.attachment.content.toString("base64"),
          },
        ],
      }),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Resend API error (${res.status}): ${errorText}`);
  }
}
