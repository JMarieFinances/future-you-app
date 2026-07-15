export type BusinessSectionKey =
  | "revenueSources"
  | "operatingExpenses"
  | "businessSpending"
  | "businessSavings";

export const businessSections: {
  key: BusinessSectionKey;
  title: string;
  items: string[];
}[] = [
  {
    key: "revenueSources",
    title: "Revenue",
    items: [
      "Product Sales",
      "Services",
      "Subscriptions",
      "Consulting",
      "Client Projects",
      "Affiliate Income",
      "Advertising",
      "Licensing",
      "Investments",
      "Other Revenue",
    ],
  },

  {
    key: "operatingExpenses",
    title: "Operating Expenses",
    items: [
      "Rent",
      "Utilities",
      "Payroll",
      "Contract Labor",
      "Insurance",
      "Taxes",
      "Software",
      "Inventory",
      "Office Supplies",
      "Equipment",
      "Internet",
      "Phone",
      "Professional Services",
      "Shipping",
      "Merchant Fees",
      "Loan Payments",
      "Licenses & Permits",
      "Maintenance",
    ],
  },

  {
    key: "businessSpending",
    title: "Business Spending",
    items: [
      "Marketing",
      "Advertising",
      "Travel",
      "Meals",
      "Fuel",
      "Education",
      "Networking",
      "Events",
      "Research",
      "Subscriptions",
      "Small Purchases",
      "Miscellaneous",
    ],
  },

  {
    key: "businessSavings",
    title: "Savings & Reserves",
    items: [
      "Emergency Fund",
      "Tax Savings",
      "Expansion",
      "Equipment Replacement",
      "Payroll Reserve",
      "Operating Reserve",
      "Future Investments",
      "Custom Goal",
    ],
  },
];