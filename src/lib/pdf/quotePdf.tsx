import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { calculateTotal } from "@/lib/quotes";

type QuotePdfData = {
  id: string;
  title: string;
  notes: string | null;
  createdAt: Date;
  organization: { name: string };
  client: {
    name: string;
    address: string | null;
    email: string | null;
    phone: string | null;
  };
  items: { description: string; quantity: number; unitPrice: number }[];
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#171717" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 12,
    marginBottom: 16,
  },
  businessName: { fontSize: 16, fontWeight: 700 },
  muted: { color: "#737373", fontSize: 10 },
  section: { marginBottom: 16 },
  label: { fontSize: 9, color: "#737373", textTransform: "uppercase", marginBottom: 2 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    paddingVertical: 6,
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalLabel: { fontSize: 13, fontWeight: 700 },
});

function QuotePdfDocument({ quote }: { quote: QuotePdfData }) {
  const total = calculateTotal(quote.items);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{quote.organization.name}</Text>
            <Text style={styles.muted}>Quote #{quote.id.slice(-8)}</Text>
          </View>
          <Text style={styles.muted}>{quote.createdAt.toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bill to</Text>
          <Text>{quote.client.name}</Text>
          {quote.client.address && <Text style={styles.muted}>{quote.client.address}</Text>}
          {quote.client.email && <Text style={styles.muted}>{quote.client.email}</Text>}
          {quote.client.phone && <Text style={styles.muted}>{quote.client.phone}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{quote.title}</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.colDescription, styles.muted]}>Description</Text>
            <Text style={[styles.colQty, styles.muted]}>Qty</Text>
            <Text style={[styles.colPrice, styles.muted]}>Price</Text>
            <Text style={[styles.colTotal, styles.muted]}>Total</Text>
          </View>

          {quote.items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>${item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.colTotal}>${(item.quantity * item.unitPrice).toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total: ${total.toFixed(2)}</Text>
          </View>
        </View>

        {quote.notes && (
          <View style={styles.section}>
            <Text style={styles.label}>Notes</Text>
            <Text>{quote.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function generateQuotePdfBuffer(quote: QuotePdfData): Promise<Buffer> {
  return renderToBuffer(<QuotePdfDocument quote={quote} />);
}
