export type HouseholdSectionKey =
  | "incomeSources"
  | "bills"
  | "spending"
  | "savings";

export const householdSections: {
  key: HouseholdSectionKey;
  title: string;
  items: string[];
}[] = [
  {
    key: "incomeSources",
    title: "Income",
    items: [
      "Your Paycheck",
      "Partner Paycheck",
      "Side Income",
      "Child Support",
      "Government Benefits",
      "Rental Income",
      "Investment Income",
      "Other Income",
    ],
  },

  {
    key: "bills",
    title: "Fixed Expenses",
    items: [
      "Mortgage / Rent",
      "Electric",
      "Water",
      "Gas",
      "Internet",
      "Phone",
      "Trash",
      "HOA",
      "Home Insurance",
      "Health Insurance",
      "Life Insurance",
      "Car Insurance",
      "Subscriptions",
      "Loan Payments",
      "Property Taxes",
      "Childcare",
    ],
  },

  {
    key: "spending",
    title: "Variable Spending",
    items: [
      "Groceries",
      "Dining Out",
      "Coffee",
      "Transportation",
      "Gas",
      "Household Supplies",
      "Cleaning Supplies",
      "Personal Care",
      "Clothing",
      "Entertainment",
      "Pets",
      "Kids",
      "Medical",
      "Gifts",
      "Travel",
      "Home Decor",
      "Furniture",
      "Miscellaneous",
    ],
  },

  {
    key: "savings",
    title: "Savings & Goals",
    items: [
      "Emergency Fund",
      "Vacation",
      "Home Repairs",
      "Down Payment",
      "New Vehicle",
      "Holiday Fund",
      "College Fund",
      "Investment Account",
      "Retirement",
      "Future Home",
      "Wedding",
      "General Savings",
    ],
  },
];