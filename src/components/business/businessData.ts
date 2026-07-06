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
    title: "Business Income",
    items: [
      "Sales",
      "Services",
      "Client Payments",
      "Contracts",
      "Tips",
      "Other Income",
    ],
  },
  {
    key: "operatingExpenses",
    title: "Operating Expenses",
    items: [
      "Rent",
      "Utilities",
      "Payroll",
      "Insurance",
      "Software",
      "Internet",
      "Phone",
      "Loan Payments",
      "Taxes",
      "Licenses & Permits",
    ],
  },
  {
    key: "businessSpending",
    title: "Business Spending",
    items: [
      "Inventory",
      "Marketing",
      "Advertising",
      "Office Supplies",
      "Shipping",
      "Travel",
      "Meals",
      "Repairs & Maintenance",
      "Contractors",
      "Miscellaneous",
    ],
  },
  {
    key: "businessSavings",
    title: "Business Savings",
    items: [
      "Emergency Fund",
      "Tax Reserve",
      "Equipment Fund",
      "Expansion Fund",
      "Payroll Reserve",
      "Marketing Reserve",
    ],
  },
];