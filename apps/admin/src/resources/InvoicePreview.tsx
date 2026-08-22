import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  TextField,
} from "@mui/material";
import { getSupabaseClient } from "@nexus-crm/api";

const supabase = getSupabaseClient();

interface InvoicePreviewProps {
  open: boolean;
  onClose: () => void;
  quotation: any;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ open, onClose, quotation }) => {
  const [account, setAccount] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    if (open && quotation) {
      const loadData = async () => {
        if (quotation.account_id) {
          const { data: acc, error } = await supabase
            .from("accounts")
            .select("*")
            .eq("id", quotation.account_id)
            .single();
          if (!error) setAccount(acc);
        }

        // Generate preview invoice data
        const subtotal = parseFloat(quotation.subtotal || 0);
        const discountPercent = parseFloat(quotation.discount_percent || 0);
        const taxRate = parseFloat(quotation.tax_rate || 5);
        const discountAmount = subtotal * (discountPercent / 100);
        const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
        const total = subtotal - discountAmount + taxAmount;

        setPreviewData({
          invoice_number: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
          invoice_date: new Date().toISOString().split("T")[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          subtotal: subtotal.toFixed(2),
          discount_percent: discountPercent,
          discount_amount: discountAmount.toFixed(2),
          tax_rate: taxRate,
          tax_amount: taxAmount.toFixed(2),
          total_amount: total.toFixed(2),
          currency: quotation.currency || "AED",
          payment_terms: "Net 30",
        });
      };

      loadData();
    }
  }, [open, quotation]);

  const handleCreateInvoice = async () => {
    if (!quotation || !previewData) return;

    try {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .insert({
          invoice_number: previewData.invoice_number,
          sales_order_id: quotation.opportunity_id, // Link to the quote's opportunity/order
          account_id: quotation.account_id,
          invoice_date: previewData.invoice_date,
          due_date: previewData.due_date,
          subtotal: parseFloat(previewData.subtotal),
          discount_amount: parseFloat(previewData.discount_amount),
          discount_percent: parseFloat(previewData.discount_percent),
          tax_amount: parseFloat(previewData.tax_amount),
          total_amount: parseFloat(previewData.total_amount),
          currency: previewData.currency,
          status: "draft",
          payment_terms: previewData.payment_terms,
          billing_address: account?.billing_address || quotation.account?.billing_address || {},
          notes: `Generated from Quotation ${quotation.quote_number}`,
        })
        .select()
        .single();

      if (error) throw error;

      alert(`Invoice ${invoice.invoice_number} created successfully!`);
      onClose();
    } catch (err) {
      console.error("Failed to create invoice:", err);
      alert("Failed to create invoice. Check console for details.");
    }
  };

  if (!quotation || !previewData) return null;

  const currencySymbol = previewData.currency === "AED" ? "د.إ" : previewData.currency;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Invoice Preview — Quotation #{quotation.quote_number}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {/* Invoice Header */}
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            INVOICE
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {previewData.currency === "AED" ? "د.إ" : previewData.currency} {previewData.total_amount}
          </Typography>
        </Box>

        {/* Invoice Details */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Invoice Details</Typography>
            <Typography>Billing Date: {previewData.invoice_date}</Typography>
            <Typography>Due Date: {previewData.due_date}</Typography>
            <Typography>Invoice #: {previewData.invoice_number}</Typography>
            <Typography>Payment Terms: {previewData.payment_terms}</Typography>
            <Typography>Currency: {previewData.currency}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Bill To</Typography>
            {account ? (
              <>
                <Typography>{account.name}</Typography>
                <Typography>{account.billing_address?.street || "No address"}</Typography>
                <Typography>
                  {account.billing_address?.city || ""}, {account.billing_address?.state || ""}
                </Typography>
                <Typography>{account.billing_address?.country || ""}</Typography>
              </>
            ) : (
              <Typography color="text.secondary">Loading account details...</Typography>
            )}
          </Grid>
        </Grid>

        {/* Invoice Line Items */}
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell><strong>Quotation</strong></TableCell>
                <TableCell align="right">{quotation.subject || "Service Quotation"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Subtotal</TableCell>
                <TableCell align="right">
                  {currencySymbol} {previewData.subtotal}
                </TableCell>
              </TableRow>
              {parseFloat(previewData.discount_amount) > 0 && (
                <TableRow>
                  <TableCell>Discount ({previewData.discount_percent}%)</TableCell>
                  <TableCell align="right">
                    -{currencySymbol} {previewData.discount_amount}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell>Tax ({previewData.tax_rate}%)</TableCell>
                <TableCell align="right">
                  {currencySymbol} {previewData.tax_amount}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell align="right">
                  <strong>
                    {currencySymbol} {previewData.total_amount}
                  </strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Terms */}
        {quotation.terms_conditions && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Terms & Conditions</Typography>
            <Typography variant="body2">{quotation.terms_conditions}</Typography>
          </Box>
        )}

        {/* Notes */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Notes"
            multiline
            rows={3}
            defaultValue={quotation.notes || ""}
            fullWidth
            size="small"
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          Generated from Quotation {quotation.quote_number} on {new Date().toLocaleDateString()}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreateInvoice}>
          Create Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
};
