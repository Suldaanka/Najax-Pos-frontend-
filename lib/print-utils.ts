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
                        padding: 20px;
                        color: #000;
                    }
                    .header { text-align: center; margin-bottom: 15px; }
                    .business-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
                    .receipt-info { font-size: 12px; margin: 2px 0; text-align: center; }
                    .separator { border-top: 1px dashed #000; margin: 10px 0; }
                    
                    table { width: 100%; font-size: 12px; border-collapse: collapse; margin: 10px 0; }
                    th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 5px; }
                    td { padding: 5px 0; vertical-align: top; }
                    .qty { text-align: center; width: 30px; }
                    .price { text-align: right; width: 70px; }
                    
                    .totals { margin-top: 10px; }
                    .total-row { display: flex; justify-content: space-between; font-size: 14px; margin: 2px 0; }
                    .grand-total { font-weight: bold; font-size: 18px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
                    
                    .footer { text-align: center; margin-top: 20px; font-size: 11px; }
                    .qr-container { text-align: center; margin: 15px 0; }
                    .qr-code { width: 120px; height: 120px; }
                    .thank-you { font-weight: bold; margin-top: 10px; font-size: 14px; }
                    
                    @media print {
                        body { width: 100%; padding: 10px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="business-name">${businessName}</div>
                    <div class="receipt-info">Order #${saleId}</div>
                    <div class="receipt-info">${new Date(sale.createdAt).toLocaleString()}</div>
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
                        ${sale.items?.map((item: any) => `
                            <tr>
                                <td>${item.product?.name || 'Product'}</td>
                                <td class="qty">${item.quantity}</td>
                                <td class="price">$${Number(item.price).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="separator"></div>

                <div class="totals">
                    <div class="total-row grand-total">
                        <span>Total Paid</span>
                        <span>$${Number(sale.totalAmount).toFixed(2)}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Payment: ${sale.paymentMethod || "CASH"} (${sale.type === 'CASH' || !sale.type ? 'PAID' : 'LOAN'})</p>
                    
                    <div class="qr-container">
                        <img src="${qrCodeUrl}" alt="QR Code" class="qr-code" />
                        <p style="margin-top: 5px; opacity: 0.7;">Scan to verify receipt</p>
                    </div>

                    <p class="thank-you">THANK YOU FOR YOUR VISIT!</p>
                    <p style="margin-top: 10px; font-size: 9px; opacity: 0.5;">Powered by NAJAX POS</p>
                </div>

                <script>
                    window.onload = function() {
                        // Small delay to ensure QR code image is loaded
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
        </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
};
