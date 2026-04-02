/**
 * Shared utility for printing receipts across the application (POS and Sales).
 */

export const printReceipt = (sale: any, businessName: string = "NAJAX POS") => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
        alert("Please allow popups to print receipts.");
        return;
    }

    const saleId = sale.id.slice(-6).toUpperCase();
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${sale.id}`;

    const subtotal = Number(sale.totalAmount) / (1 - (Number(sale.discountPercentage) / 100));
    const discountAmount = subtotal - Number(sale.totalAmount);
    const branch = sale.branch || {};
    const paymentMethodLabel = sale.paymentMethod || "CASH";

    const receiptHtml = `
        <html>
            <head>
                <title>Receipt - #${saleId}</title>
                <style>
                    @page { margin: 0; }
                    body { 
                        font-family: 'Courier New', Courier, monospace; 
                        width: 300px; 
                        margin: 0 auto; 
                        padding: 10px;
                        color: #000;
                        line-height: 1.2;
                    }
                    .header { text-align: center; margin-bottom: 10px; }
                    .business-name { font-size: 20px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
                    .branch-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
                    .branch-info { font-size: 11px; margin: 1px 0; }
                    .receipt-info { font-size: 11px; margin: 4px 0; border-top: 1px solid #eee; padding-top: 4px; }
                    .separator { border-top: 1px dashed #000; margin: 8px 0; }
                    
                    table { width: 100%; font-size: 11px; border-collapse: collapse; margin: 8px 0; }
                    th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 3px; font-weight: bold; }
                    td { padding: 4px 0; vertical-align: top; }
                    .qty { text-align: center; width: 30px; }
                    .price { text-align: right; width: 70px; }
                    
                    .totals { margin-top: 8px; border-top: 1px solid #eee; padding-top: 5px; }
                    .total-row { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
                    .grand-total { font-weight: bold; font-size: 16px; border-top: 1px double #000; padding-top: 5px; margin-top: 5px; }
                    .payment-method { font-weight: bold; text-transform: uppercase; font-size: 13px; margin: 8px 0; text-align: center; border: 1px solid #000; padding: 4px; }
                    
                    .footer { text-align: center; margin-top: 15px; font-size: 10px; }
                    .qr-container { text-align: center; margin: 12px 0; }
                    .qr-code { width: 100px; height: 100px; }
                    .thank-you { font-weight: bold; margin-top: 8px; font-size: 13px; text-transform: uppercase; }
                    
                    @media print {
                        body { width: 100%; padding: 5px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="business-name">${businessName}</div>
                    ${branch.name ? `<div class="branch-name">${branch.name}</div>` : ''}
                    ${branch.address ? `<div class="branch-info">${branch.address}</div>` : ''}
                    ${branch.phone ? `<div class="branch-info">Tel: ${branch.phone}</div>` : ''}
                    
                    <div class="receipt-info">
                        <div>Order: #${saleId}</div>
                        <div>Date: ${new Date(sale.createdAt).toLocaleString()}</div>
                        ${sale.customer ? `<div>Cust: ${sale.customer.name}</div>` : ''}
                    </div>
                </div>

                <div class="separator"></div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th class="qty">Qty</th>
                            <th class="price">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(sale.items || []).map((item: any) => `
                            <tr>
                                <td>${item.product?.name || 'Product'}</td>
                                <td class="qty">${Number(item.quantity)}</td>
                                <td class="price">$${Number(item.price).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="separator"></div>

                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    ${Number(sale.discountPercentage) > 0 ? `
                    <div class="total-row">
                        <span>Discount (${sale.discountPercentage}%)</span>
                        <span>-$${discountAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="total-row grand-total">
                        <span>TOTAL PAID</span>
                        <span>$${Number(sale.totalAmount).toFixed(2)}</span>
                    </div>
                    
                    ${sale.paymentCurrency === "SOS" ? `
                    <div class="total-row" style="font-weight: bold; font-size: 14px; margin-top: 5px;">
                        <span>In SOS</span>
                        <span>${Number(sale.paidAmountShiling).toLocaleString()} SOS</span>
                    </div>
                    <div class="total-row" style="font-size: 9px; opacity: 0.7;">
                        <span>Rate: 1 USD =</span>
                        <span>${Number(sale.exchangeRate).toLocaleString()} SOS</span>
                    </div>
                    ` : ''}
                </div>

                <div class="payment-method">
                    Payment: ${paymentMethodLabel}
                </div>

                <div class="footer">
                    <div class="qr-container">
                        <img src="${qrCodeUrl}" alt="QR Code" class="qr-code" />
                        <p style="margin-top: 3px; opacity: 0.6; font-size: 9px;">Scan to verify receipt</p>
                    </div>

                    <p class="thank-you">THANK YOU!</p>
                    <p style="margin-top: 8px; font-size: 8px; opacity: 0.4;">Powered by NAJAX POS</p>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 300);
                    };
                </script>
            </body>
        </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
};
