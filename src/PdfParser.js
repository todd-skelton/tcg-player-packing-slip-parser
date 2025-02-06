import React, { useState } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PDFParser = () => {
  const [parsedData, setParsedData] = useState(null);

  const parsePDF = async (file) => {
    const pdf = await getDocument(await file.arrayBuffer()).promise;

    let orders = [];
    let currentOrderText = "";
    let currentOrderNumber = null;
    const orderStartRegex = /Order Number:\s*(\S+)/;

    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const textContent = await page.getTextContent();
      const extractedText = textContent.items
        .map((item) => item.str)
        .join("\n");

      // Check if the page starts a new order
      const orderNumberMatch = extractedText.match(orderStartRegex);
      if (orderNumberMatch) {
        const foundOrderNumber = orderNumberMatch[1];

        if (currentOrderNumber && currentOrderNumber !== foundOrderNumber) {
          // Process the current order if the number changes
          const parsedOrder = processOrderText(currentOrderText);
          orders.push(parsedOrder);
          currentOrderText = "";
        }

        currentOrderNumber = foundOrderNumber;
      }

      // Append the current page to the ongoing order
      currentOrderText += `\n${extractedText}`;
    }

    // Process the last order
    if (currentOrderText) {
      const parsedOrder = processOrderText(currentOrderText);
      orders.push(parsedOrder);
    }

    console.log(orders);

    setParsedData(orders);
  };

  const processOrderText = (orderText) => {
    console.log(orderText);
    // Locate the start of the items section
    const itemsSectionRegex =
      /Quantity\s+Description\s+Price\s+Total Price([\s\S]*)/;
    const itemsSectionMatch = orderText.match(itemsSectionRegex);

    if (!itemsSectionMatch) {
      return {
        orderNumber: null,
        orderDate: null,
        totalQty: 0,
        totalPrice: 0,
        items: [],
      };
    }

    const itemsSection = itemsSectionMatch[1].trim();

    // Regex for extracting order number
    const orderStartRegex = /Order Number:\s*(\S+)/;
    const orderNumberMatch = orderText.match(orderStartRegex);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : null;

    // Regex for extracting order date
    const orderDateRegex =
      /Order Date:\s*Shipping Method:\s*Buyer Name:\s*Seller Name:\s*(\d{2}\/\d{2}\/\d{4})/;
    const orderDateMatch = orderText.match(orderDateRegex);
    const orderDate = orderDateMatch ? orderDateMatch[1] : null;

    // Regex for extracting items
    const itemRegex =
      /(\d+)\s+((?:.*?(?:\n|$))+?)\s*\$(\d+\.\d{2})\s*\$(\d+\.\d{2})/g;

    const items = [];
    let match;

    while ((match = itemRegex.exec(itemsSection)) !== null) {
      items.push({
        quantity: parseInt(match[1]),
        description: match[2].replace(/\n/g, " ").trim(),
        price: parseFloat(match[3]),
        totalPrice: parseFloat(match[4]),
      });
    }

    // Regex for extracting totals
    const totalQtyRegex = /(\d+)\s+Total/;
    const totalPriceRegex = /Total\s+\$(\d+\.\d{2})/;

    const totalQtyMatch = orderText.match(totalQtyRegex);
    const totalPriceMatch = orderText.match(totalPriceRegex);

    return {
      orderNumber,
      orderDate,
      totalQty: totalQtyMatch ? parseInt(totalQtyMatch[1]) : 0,
      totalPrice: totalPriceMatch ? parseFloat(totalPriceMatch[1]) : 0,
      items,
    };
  };

  return (
    <div>
      <h1>PDF Parser</h1>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          if (e.target.files[0]) parsePDF(e.target.files[0]);
        }}
      />
      {parsedData && (
        <pre style={{ textAlign: "left" }}>
          {JSON.stringify(parsedData, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default PDFParser;
