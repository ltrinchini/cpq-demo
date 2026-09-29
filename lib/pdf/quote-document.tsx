import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { breakdownWidths } from "@/lib/breakdown";
import type { QuoteDetail } from "@/lib/db/queries";
import {
  formatCurrency,
  formatDate,
  formatLb,
  formatQuantity,
} from "@/lib/format";
import { PDF_COLORS, PDF_COST_LINE_COLORS } from "@/lib/pdf/colors";
import { FONT_SANS, FONT_SERIF, registerPdfFonts } from "@/lib/pdf/fonts";
import {
  BAG_SIZE_KG,
  BAG_SIZE_LABELS,
  COST_LINE_LABELS,
  GRIND_LABELS,
  ORIGIN_LABELS,
  ROAST_PROFILE_LABELS,
} from "@/lib/labels";
import { COST_LINES } from "@/lib/pricing/types";

registerPdfFonts();

/** Fictional roastery contact details for the PDF header and footer. */
const ROASTERY = {
  name: "Lantern Roasters",
  addressLine: "48 Kiln Street, Toronto, ON M5V 2T6",
  phone: "(416) 555-0148",
  email: "hello@lanternroasters.example",
};

const styles = StyleSheet.create({
  page: {
    padding: "20mm",
    fontFamily: FONT_SANS,
    fontSize: 10,
    color: PDF_COLORS.ink,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottom: `2pt solid ${PDF_COLORS.roastBrown}`,
  },
  roasteryName: {
    fontFamily: FONT_SERIF,
    fontWeight: 600,
    fontSize: 20,
    color: PDF_COLORS.roastBrown,
  },
  contactDetails: {
    marginTop: 4,
    fontSize: 9,
    color: PDF_COLORS.slate,
  },
  quoteMeta: {
    alignItems: "flex-end",
  },
  quoteNumber: {
    fontFamily: FONT_SERIF,
    fontWeight: 600,
    fontSize: 13,
    color: PDF_COLORS.roastBrown,
  },
  quoteMetaLine: {
    marginTop: 4,
    fontSize: 9,
    color: PDF_COLORS.slate,
  },
  section: {
    marginTop: 18,
  },
  sectionHeading: {
    fontFamily: FONT_SERIF,
    fontWeight: 600,
    fontSize: 12,
    color: PDF_COLORS.roastBrown,
    marginBottom: 6,
  },
  notes: {
    marginTop: 4,
    fontSize: 9,
    color: PDF_COLORS.slate,
  },
  table: {
    borderTop: `1pt solid ${PDF_COLORS.frost}`,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottom: `1pt solid ${PDF_COLORS.frost}`,
  },
  tableLabel: {
    color: PDF_COLORS.slate,
  },
  tableValue: {
    fontVariantNumeric: "tabular-nums",
  },
  breakdownBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 2,
    overflow: "hidden",
  },
  legend: {
    marginTop: 10,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  legendLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 1,
    marginRight: 6,
  },
  legendValue: {
    fontVariantNumeric: "tabular-nums",
  },
  totalRow: {
    marginTop: 18,
    paddingTop: 8,
    borderTop: `2pt solid ${PDF_COLORS.goldenBean}`,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  totalLabel: {
    fontFamily: FONT_SERIF,
    fontSize: 13,
    fontWeight: 600,
    color: PDF_COLORS.roastBrown,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 600,
    color: PDF_COLORS.roastBrown,
    fontVariantNumeric: "tabular-nums",
  },
  terms: {
    marginTop: 12,
    fontSize: 9,
    color: PDF_COLORS.slate,
  },
  footer: {
    position: "absolute",
    bottom: "12mm",
    left: "20mm",
    right: "20mm",
    paddingTop: 8,
    borderTop: `1pt solid ${PDF_COLORS.frost}`,
    fontSize: 8,
    color: PDF_COLORS.slate,
    textAlign: "center",
  },
});

interface QuoteDocumentProps {
  quote: QuoteDetail;
}

/**
 * The Lantern Roasters PDF quote (`docs/design.md`, "PDF quote — Lantern
 * Roasters"): header, customer, order, price breakdown, total, terms,
 * footer. Amounts come from `quote.resultSnapshot`, the frozen copy — never
 * recalculated.
 */
export function QuoteDocument({ quote }: QuoteDocumentProps) {
  const { configuration, resultSnapshot, currency } = quote;
  const widths = breakdownWidths(resultSnapshot.lines, resultSnapshot.total);

  return (
    <Document title={`Quote ${quote.number}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.roasteryName}>{ROASTERY.name}</Text>
            <Text style={styles.contactDetails}>{ROASTERY.addressLine}</Text>
            <Text style={styles.contactDetails}>
              {ROASTERY.phone} · {ROASTERY.email}
            </Text>
          </View>
          <View style={styles.quoteMeta}>
            <Text style={styles.quoteNumber}>{quote.number}</Text>
            <Text style={styles.quoteMetaLine}>
              {formatDate(quote.createdAt)}
            </Text>
            <Text style={styles.quoteMetaLine}>
              Valid until {formatDate(quote.validUntil)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Customer</Text>
          <Text>{quote.customerName}</Text>
          {quote.notes && <Text style={styles.notes}>{quote.notes}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Order</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Coffee</Text>
              <Text style={styles.tableValue}>
                {ORIGIN_LABELS[configuration.origins[0].originId]}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Roast</Text>
              <Text style={styles.tableValue}>
                {ROAST_PROFILE_LABELS[configuration.roast]}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Grind</Text>
              <Text style={styles.tableValue}>
                {GRIND_LABELS[configuration.grind]}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Bag size</Text>
              <Text style={styles.tableValue}>
                {BAG_SIZE_LABELS[configuration.bagSize]} (
                {formatLb(BAG_SIZE_KG[configuration.bagSize])})
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Quantity</Text>
              <Text style={styles.tableValue}>
                {formatQuantity(configuration.quantity, "bag", "bags")}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Unit price</Text>
              <Text style={styles.tableValue}>
                {formatCurrency(resultSnapshot.unitPrice, currency)} / bag
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Price breakdown</Text>
          <View style={styles.breakdownBar}>
            {COST_LINES.map((line) => (
              <View
                key={line}
                style={{
                  width: `${widths[line].toFixed(4)}%`,
                  backgroundColor: PDF_COST_LINE_COLORS[line],
                }}
              />
            ))}
          </View>
          <View style={styles.legend}>
            {COST_LINES.map((line) => (
              <View key={line} style={styles.legendRow}>
                <View style={styles.legendLabel}>
                  <View
                    style={{
                      ...styles.legendSwatch,
                      backgroundColor: PDF_COST_LINE_COLORS[line],
                    }}
                  />
                  <Text>{COST_LINE_LABELS[line]}</Text>
                </View>
                <Text style={styles.legendValue}>
                  {formatCurrency(resultSnapshot.lines[line], currency)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(resultSnapshot.total, currency)}
          </Text>
        </View>

        <View style={styles.terms}>
          <Text>Prices exclude applicable taxes.</Text>
          <Text>This quote is valid until {formatDate(quote.validUntil)}.</Text>
        </View>

        <Text style={styles.footer}>
          {ROASTERY.name} · {ROASTERY.addressLine} · {ROASTERY.phone} ·{" "}
          {ROASTERY.email}
        </Text>
      </Page>
    </Document>
  );
}
