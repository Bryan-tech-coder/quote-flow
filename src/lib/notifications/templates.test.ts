import { describe, it, expect } from "vitest";
import { renderTemplate } from "@/lib/notifications/templates";

const ctx = {
  quoteTitle: "Roof repair",
  clientName: "Ferretería El Martillo",
  businessName: "Contratista Ramos LLC",
  total: 850,
  quoteUrl: "http://localhost:3000/dashboard/quotes/abc123",
};

describe("renderTemplate", () => {
  it("QUOTE_SENT addresses the client and includes the quote link", () => {
    const { subject, body } = renderTemplate("QUOTE_SENT", ctx);
    expect(subject).toContain(ctx.businessName);
    expect(subject).toContain(ctx.quoteTitle);
    expect(body).toContain(ctx.clientName);
    expect(body).toContain("$850.00");
    expect(body).toContain(ctx.quoteUrl);
  });

  it("QUOTE_APPROVED reports the client's decision", () => {
    const { subject, body } = renderTemplate("QUOTE_APPROVED", ctx);
    expect(subject.toLowerCase()).toContain("approved");
    expect(body).toContain(ctx.clientName);
    expect(body).toContain(ctx.quoteTitle);
  });

  it("QUOTE_REJECTED reports the client's decision", () => {
    const { subject, body } = renderTemplate("QUOTE_REJECTED", ctx);
    expect(subject.toLowerCase()).toContain("rejected");
    expect(body).toContain(ctx.clientName);
  });

  it("formats the total to two decimal places", () => {
    const { body } = renderTemplate("QUOTE_SENT", { ...ctx, total: 1234.5 });
    expect(body).toContain("$1234.50");
  });
});
